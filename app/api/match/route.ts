import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// ── Validation schema ─────────────────────────────────────────
const MatchRequestSchema = z.object({
  examSlug: z.string().min(1),
  genderPref: z.enum(['male', 'female', 'any']),
  areaId: z.string().min(1),
});

// ── Haversine distance (km) ───────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Price freshness check (60 days) ──────────────────────────
const PRICE_MAX_AGE_DAYS = 60;

function isPriceFresh(checkedAt: string | null): boolean {
  if (!checkedAt) return false;
  const ageMs = Date.now() - new Date(checkedAt).getTime();
  return ageMs < PRICE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

// ── Types ─────────────────────────────────────────────────────
interface DoctorRow {
  id: string;
  name: string;
  gender: string;
  visiting_days: string[];
  visiting_hours: string | null;
  phone: string | null;
  last_verified_at: string | null;
  source: string | null;
  hospital_id: string;
}

interface HospitalExamRow {
  hospital_id: string;
  price: number | null;
  price_source: string | null;
  price_checked_at: string | null;
}

interface HospitalRow {
  id: string;
  name_en: string;
  name_bn: string;
  address: string | null;
  area_id: string | null;
  lat: number;
  lng: number;
  last_verified_at: string | null;
  source: string | null;
}

// ── POST /api/match ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse & validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = MatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { examSlug, genderPref, areaId } = parsed.data;

  // 2. Fetch area lat/lng
  const { data: areaData, error: areaErr } = await supabase
    .from('areas')
    .select('id, lat, lng')
    .eq('id', areaId)
    .single();

  if (areaErr || !areaData) {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 });
  }

  const { lat: areaLat, lng: areaLng } = areaData;

  // 3. Fetch exam id from slug
  const { data: examData, error: examErr } = await supabase
    .from('exams')
    .select('id')
    .eq('slug', examSlug)
    .single();

  if (examErr || !examData) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const examId = examData.id;

  // 4. Fetch all matching doctors (gender filter applied here)
  let doctorQuery = supabase
    .from('doctor_exams')
    .select(`
      doctors!inner(
        id, name, gender, gender_verified,
        visiting_days, visiting_hours, phone,
        last_verified_at, source, hospital_id
      )
    `)
    .eq('exam_id', examId)
    .eq('doctors.gender_verified', true);

  if (genderPref !== 'any') {
    doctorQuery = doctorQuery.eq('doctors.gender', genderPref);
  }

  const { data: doctorExamRows, error: docErr } = await doctorQuery;

  if (docErr) {
    return NextResponse.json({ error: docErr.message }, { status: 500 });
  }

  const doctors: DoctorRow[] = (doctorExamRows ?? []).map((row: Record<string, unknown>) => {
    const d = row.doctors as Record<string, unknown>;
    return {
      id: d.id as string,
      name: d.name as string,
      gender: d.gender as string,
      visiting_days: (d.visiting_days ?? []) as string[],
      visiting_hours: d.visiting_hours as string | null,
      phone: d.phone as string | null,
      last_verified_at: d.last_verified_at as string | null,
      source: d.source as string | null,
      hospital_id: d.hospital_id as string,
    };
  });

  if (doctors.length === 0) {
    return NextResponse.json({
      results: [],
      widenedTo: null,
      reason: `No ${genderPref === 'any' ? '' : genderPref + ' '}doctors found for this exam.`,
    });
  }

  // 5. Fetch hospitals for those doctors
  const hospitalIds = [...new Set(doctors.map((d) => d.hospital_id))];

  const { data: hospitalsData, error: hospErr } = await supabase
    .from('hospitals')
    .select('id, name_en, name_bn, address, area_id, lat, lng, last_verified_at, source')
    .in('id', hospitalIds);

  if (hospErr) {
    return NextResponse.json({ error: hospErr.message }, { status: 500 });
  }

  const hospitals: HospitalRow[] = (hospitalsData ?? []) as HospitalRow[];
  const hospitalMap = new Map<string, HospitalRow>(hospitals.map((h) => [h.id, h]));

  // 6. Fetch hospital_exams for pricing
  const { data: heData, error: heErr } = await supabase
    .from('hospital_exams')
    .select('hospital_id, price, price_source, price_checked_at')
    .in('hospital_id', hospitalIds)
    .eq('exam_id', examId);

  if (heErr) {
    return NextResponse.json({ error: heErr.message }, { status: 500 });
  }

  const heMap = new Map<string, HospitalExamRow>();
  for (const row of (heData ?? []) as HospitalExamRow[]) {
    heMap.set(row.hospital_id, row);
  }

  // 7. Compute distances & apply radius widening
  const hospitalDistances = new Map<string, number>();
  for (const h of hospitals) {
    hospitalDistances.set(h.id, haversine(areaLat, areaLng, h.lat, h.lng));
  }

  let radiusKm = 10;
  const MAX_RADIUS = 30;
  const STEP = 5;
  let widenedTo: number | null = null;

  // Group doctors by hospital first
  const doctorsByHospital = new Map<string, DoctorRow[]>();
  for (const doc of doctors) {
    const list = doctorsByHospital.get(doc.hospital_id) ?? [];
    list.push(doc);
    doctorsByHospital.set(doc.hospital_id, list);
  }

  let filteredHospitals: HospitalRow[] = [];

  while (radiusKm <= MAX_RADIUS) {
    filteredHospitals = hospitals.filter(
      (h) => (hospitalDistances.get(h.id) ?? Infinity) <= radiusKm
    );

    if (filteredHospitals.length > 0) {
      if (radiusKm > 10) widenedTo = radiusKm;
      break;
    }
    radiusKm += STEP;
  }

  if (filteredHospitals.length === 0) {
    return NextResponse.json({
      results: [],
      widenedTo: MAX_RADIUS,
      reason: `No results found within ${MAX_RADIUS} km. Try a different area or exam.`,
    });
  }

  // 8. Sort hospitals by distance and build results
  filteredHospitals.sort(
    (a, b) => (hospitalDistances.get(a.id) ?? 0) - (hospitalDistances.get(b.id) ?? 0)
  );

  const results = filteredHospitals
    .filter((h) => doctorsByHospital.has(h.id))
    .map((h) => {
      const he = heMap.get(h.id) ?? null;
      const fresh = he ? isPriceFresh(he.price_checked_at) : false;

      return {
        hospital: {
          id: h.id,
          name_en: h.name_en,
          name_bn: h.name_bn,
          address: h.address,
          area_id: h.area_id,
          last_verified_at: h.last_verified_at,
          source: h.source,
        },
        distanceKm: Math.round((hospitalDistances.get(h.id) ?? 0) * 10) / 10,
        price: fresh && he ? he.price : null,
        priceSource: fresh && he ? he.price_source : null,
        priceConfirm: !fresh,
        doctors: (doctorsByHospital.get(h.id) ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          gender: d.gender,
          visiting_days: d.visiting_days,
          visiting_hours: d.visiting_hours,
          phone: d.phone,
          last_verified_at: d.last_verified_at,
          source: d.source,
        })),
      };
    });

  return NextResponse.json({
    results,
    widenedTo,
    reason: null,
  });
}

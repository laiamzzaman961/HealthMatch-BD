/**
 * scripts/seed.ts
 *
 * Idempotent seed script — deletes all rows then inserts from data/seed.json.
 * Run with: npx tsx scripts/seed.ts
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const seedPath = path.resolve(__dirname, '../data/seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

if (!seed.SEED_IS_DEV) {
  console.error('SEED_IS_DEV is not true — aborting to protect production data.');
  process.exit(1);
}

async function run() {
  console.log('⚠️  SEED_IS_DEV mode — deleting all rows before re-seeding...');

  // Delete in reverse dependency order
  for (const table of ['doctor_exams', 'hospital_exams', 'doctors', 'hospitals', 'exams', 'areas']) {
    try {
      if (table === 'doctor_exams' || table === 'hospital_exams') {
        const { error } = await supabase.from(table).delete().not('exam_id', 'is', null);
        if (error) console.warn(`  Warning clearing ${table}:`, error.message);
        else console.log(`  Cleared ${table}`);
      } else {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) console.warn(`  Warning clearing ${table}:`, error.message);
        else console.log(`  Cleared ${table}`);
      }
    } catch (e: unknown) {
      console.warn(`  Exception clearing ${table}:`, e);
    }
  }

  // ── Areas ──
  console.log('Inserting areas...');
  const areasPayload = seed.areas.map((a: Record<string, unknown>) => ({
    id: a.id,
    name_en: a.name_en,
    name_bn: a.name_bn,
    lat: a.lat,
    lng: a.lng,
    aliases: a.aliases,
  }));
  const { error: aErr } = await supabase.from('areas').insert(areasPayload);
  if (aErr) throw new Error(`areas: ${aErr.message}`);

  // ── Exams ──
  console.log('Inserting exams...');
  const examsPayload = seed.exams.map((e: Record<string, unknown>) => ({
    id: e.id,
    slug: e.slug,
    name_en: e.name_en,
    name_bn: e.name_bn,
    aliases: e.aliases,
  }));
  const { error: eErr } = await supabase.from('exams').insert(examsPayload);
  if (eErr) throw new Error(`exams: ${eErr.message}`);

  // ── Hospitals ──
  console.log('Inserting hospitals...');
  const hospsPayload = seed.hospitals.map((h: Record<string, unknown>) => ({
    id: h.id,
    name_en: h.name_en,
    name_bn: h.name_bn,
    area_id: h.area_id,
    address: h.address,
    lat: h.lat,
    lng: h.lng,
    source: h.source,
    last_verified_at: h.last_verified_at,
  }));
  const { error: hErr } = await supabase.from('hospitals').insert(hospsPayload);
  if (hErr) throw new Error(`hospitals: ${hErr.message}`);

  // ── Hospital exams ──
  console.log('Inserting hospital_exams...');
  const hePayload = seed.hospital_exams.map((he: Record<string, unknown>) => ({
    hospital_id: he.hospital_id,
    exam_id: he.exam_id,
    price: he.price,
    price_source: he.price_source,
    price_checked_at: he.price_checked_at,
  }));
  const { error: heErr } = await supabase.from('hospital_exams').insert(hePayload);
  if (heErr) throw new Error(`hospital_exams: ${heErr.message}`);

  // ── Doctors ──
  console.log('Inserting doctors...');
  const docsPayload = seed.doctors.map((d: Record<string, unknown>) => ({
    id: d.id,
    name: d.name,
    gender: d.gender,
    gender_verified: d.gender_verified,
    hospital_id: d.hospital_id,
    phone: d.phone,
    visiting_days: d.visiting_days,
    visiting_hours: d.visiting_hours,
    last_verified_at: d.last_verified_at,
    source: d.source,
  }));
  const { error: dErr } = await supabase.from('doctors').insert(docsPayload);
  if (dErr) throw new Error(`doctors: ${dErr.message}`);

  // ── Doctor exams ──
  console.log('Inserting doctor_exams...');
  const dePayload = seed.doctor_exams.map((de: Record<string, unknown>) => ({
    doctor_id: de.doctor_id,
    exam_id: de.exam_id,
  }));
  const { error: deErr } = await supabase.from('doctor_exams').insert(dePayload);
  if (deErr) throw new Error(`doctor_exams: ${deErr.message}`);

  console.log('✅ Seed complete!');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

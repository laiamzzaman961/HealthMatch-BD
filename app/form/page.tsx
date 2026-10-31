'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────────────
interface Area {
  id: string;
  name_en: string;
  name_bn: string;
}

interface Doctor {
  id: string;
  name: string;
  gender: string;
  visiting_days: string[];
  visiting_hours: string | null;
  phone: string | null;
  last_verified_at: string | null;
  source: string | null;
}

interface HospitalResult {
  hospital: {
    id: string;
    name_en: string;
    name_bn: string;
    address: string | null;
    area_id: string | null;
    last_verified_at: string | null;
    source: string | null;
  };
  distanceKm: number;
  price: number | null;
  priceSource: string | null;
  priceConfirm: boolean;
  doctors: Doctor[];
}

interface MatchResponse {
  results: HospitalResult[];
  widenedTo: number | null;
  reason: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EXAM_OPTIONS = [
  { slug: 'usg',  en: 'Ultrasonography (USG)', bn: 'আলট্রাসনোগ্রাফি' },
  { slug: 'xray', en: 'X-Ray',                 bn: 'এক্স-রে' },
  { slug: 'cbc',  en: 'CBC Blood Test',         bn: 'সিবিসি রক্ত পরীক্ষা' },
];

const GENDER_OPTIONS = [
  { value: 'female', en: 'Female doctor', bn: 'মহিলা ডাক্তার' },
  { value: 'male',   en: 'Male doctor',   bn: 'পুরুষ ডাক্তার' },
  { value: 'any',    en: 'No preference', bn: 'যেকোনো' },
];

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div className="skeleton" style={{ height: 24, width: '60%' }} />
      <div className="skeleton" style={{ height: 16, width: '40%' }} />
      <div className="skeleton" style={{ height: 16, width: '80%' }} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div className="skeleton" style={{ height: 28, width: 80 }} />
        <div className="skeleton" style={{ height: 28, width: 80 }} />
      </div>
    </div>
  );
}

// ── Doctor card ────────────────────────────────────────────────────────────
function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { t } = useLanguage();
  const todayName = DAYS_OF_WEEK[new Date().getDay()];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=doctor+${encodeURIComponent(doctor.name)}`;

  return (
    <div style={{
      background: 'var(--tint)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Name + gender */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doctor.name}</span>
        <span style={{
          fontSize: '0.75rem',
          padding: '2px 8px',
          borderRadius: 9999,
          background: doctor.gender === 'female' ? '#fce7f3' : '#dbeafe',
          color: doctor.gender === 'female' ? '#9d174d' : '#1e3a8a',
          fontWeight: 500,
        }}>
          {doctor.gender === 'female' ? t('Female', 'মহিলা') : t('Male', 'পুরুষ')}
        </span>
      </div>

      {/* Visiting days */}
      {doctor.visiting_days.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {doctor.visiting_days.map((day) => (
            <span key={day} style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 9999,
              background: day === todayName ? 'var(--primary)' : 'var(--border)',
              color: day === todayName ? '#fff' : 'var(--text-secondary)',
              fontWeight: day === todayName ? 600 : 400,
            }}>
              {day}
            </span>
          ))}
        </div>
      )}

      {/* Hours */}
      {doctor.visiting_hours && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          🕐 {doctor.visiting_hours}
        </p>
      )}

      {/* Verified date */}
      {doctor.last_verified_at && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {t('Verified:', 'যাচাই:')} {new Date(doctor.last_verified_at).toLocaleDateString()}
          {doctor.source ? ` · ${doctor.source}` : ''}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        {doctor.phone && (
          <a
            href={`tel:${doctor.phone}`}
            style={actionButtonStyle('#5E9E7A', '#fff')}
            aria-label={`Call ${doctor.name}`}
          >
            📞 {t('Call', 'কল')}
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={actionButtonStyle('var(--border)', 'var(--text-primary)')}
          aria-label={`Get directions to ${doctor.name}`}
        >
          📍 {t('Directions', 'দিকনির্দেশ')}
        </a>
        {doctor.phone && (
          <a
            href={`https://wa.me/${doctor.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={actionButtonStyle('#25D366', '#fff')}
            aria-label={`WhatsApp ${doctor.name}`}
          >
            💬 WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function actionButtonStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    minHeight: 48,
    padding: '0 1rem',
    borderRadius: 9999,
    background: bg,
    color,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  };
}

// ── Hospital card ──────────────────────────────────────────────────────────
function HospitalCard({ result }: { result: HospitalResult }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const { hospital, distanceKm, price, priceSource, priceConfirm, doctors } = result;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>
            {t(hospital.name_en, hospital.name_bn)}
          </h3>
          {hospital.address && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {hospital.address}
            </p>
          )}
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 9999,
          background: 'var(--tint)',
          color: 'var(--primary)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          {distanceKm} km
        </span>
      </div>

      {/* Price */}
      {priceConfirm ? (
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--warning-text)',
          background: 'var(--warning-bg)',
          padding: '6px 10px',
          borderRadius: 8,
          margin: 0,
        }}>
          ⚠️ {t('Price: confirm at reception.', 'মূল্য: রিসেপশনে নিশ্চিত করুন।')}
        </p>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          💵 {t('Price:', 'মূল্য:')} <strong style={{ color: 'var(--text-primary)' }}>৳{price}</strong>
          {priceSource && <span> · {priceSource}</span>}
        </p>
      )}

      {/* Meta */}
      {hospital.last_verified_at && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('Verified:', 'যাচাই:')} {new Date(hospital.last_verified_at).toLocaleDateString()}
          {hospital.source ? ` · ${hospital.source}` : ''}
        </p>
      )}

      {/* Doctor count + expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          alignSelf: 'flex-start',
          minHeight: 48,
          padding: '0 1rem',
          borderRadius: 9999,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        👨‍⚕️ {doctors.length} {t('doctor(s)', 'ডাক্তার')} {expanded ? '▲' : '▼'}
      </button>

      {/* Expanded doctor list */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main form content ──────────────────────────────────────────────────────
function FormContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const queryExam = searchParams.get('exam');
  const queryGender = searchParams.get('gender') as 'male' | 'female' | 'any' | null;
  const queryArea = searchParams.get('area');

  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areasError, setAreasError] = useState<string | null>(null);

  const [examSlug, setExamSlug] = useState(queryExam || 'usg');
  const [genderPref, setGenderPref] = useState<'male' | 'female' | 'any'>(
    queryGender && ['male', 'female', 'any'].includes(queryGender) ? queryGender : 'any'
  );
  const [areaId, setAreaId] = useState(queryArea || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResponse | null>(null);

  // Fetch areas on mount
  useEffect(() => {
    fetch('/api/areas')
      .then((r) => r.json())
      .then((data) => {
        const list: Area[] = data.areas ?? [];
        setAreas(list);
        if (!areaId && list.length > 0) {
          if (queryArea) {
            const found = list.find(
              (a) => a.id === queryArea || a.name_en.toLowerCase() === queryArea.toLowerCase()
            );
            setAreaId(found ? found.id : list[0].id);
          } else {
            setAreaId(list[0].id);
          }
        }
      })
      .catch(() => setAreasError('Failed to load areas.'))
      .finally(() => setAreasLoading(false));
  }, [areaId, queryArea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSlug, genderPref, areaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    padding: '0 0.75rem',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    appearance: 'auto',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    marginBottom: '0.375rem',
    color: 'var(--text-primary)',
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {t('Find a Doctor (Simple Form)', 'সহজ ফর্ম — ডাক্তার খুঁজুন')}
      </h1>

      {/* Health safety disclaimer - Rule 10 */}
      <div style={{
        background: 'var(--tint)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
      }}>
        <span aria-hidden="true">🛡️</span>
        <span>
          {t(
            'Health safety note: HealthMatch BD helps find providers only. It provides no medical diagnosis or health advice.',
            'স্বাস্থ্য নিরাপত্তা বিজ্ঞপ্তি: হেলথম্যাচ বিডি শুধুমাত্র তথ্য দেয়। এটি কোনো চিকিৎসা পরামর্শ বা রোগ নির্ণয় প্রদান করে না।'
          )}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Exam */}
        <div>
          <label htmlFor="exam" style={labelStyle}>
            {t('Exam / Test', 'পরীক্ষা')}
          </label>
          <select
            id="exam"
            value={examSlug}
            onChange={(e) => setExamSlug(e.target.value)}
            style={selectStyle}
          >
            {EXAM_OPTIONS.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {t(opt.en, opt.bn)}
              </option>
            ))}
          </select>
        </div>

        {/* Gender preference */}
        <div>
          <label htmlFor="gender" style={labelStyle}>
            {t('Doctor Gender', 'ডাক্তারের লিঙ্গ')}
          </label>
          <select
            id="gender"
            value={genderPref}
            onChange={(e) => setGenderPref(e.target.value as 'male' | 'female' | 'any')}
            style={selectStyle}
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.en, opt.bn)}
              </option>
            ))}
          </select>
        </div>

        {/* Area */}
        <div>
          <label htmlFor="area" style={labelStyle}>
            {t('Your Area', 'আপনার এলাকা')}
          </label>
          {areasError ? (
            <p style={{ color: 'var(--error-text)', fontSize: '0.875rem' }}>{areasError}</p>
          ) : (
            <select
              id="area"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              disabled={areasLoading}
              style={selectStyle}
            >
              {areasLoading ? (
                <option>{t('Loading…', 'লোড হচ্ছে…')}</option>
              ) : (
                areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {t(a.name_en, a.name_bn)}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || areasLoading || !areaId}
          style={{
            minHeight: 48,
            padding: '0 1.5rem',
            borderRadius: 9999,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? t('Searching…', 'খোঁজা হচ্ছে…') : t('Search', 'খুঁজুন')}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'var(--error-bg)',
          border: '1px solid var(--error-text)',
          borderRadius: 16,
          padding: '1.25rem',
          marginBottom: '1.5rem',
          color: 'var(--error-text)',
        }}>
          <p style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>
            {t('Something went wrong', 'কিছু একটা ভুল হয়েছে')}
          </p>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{
              minHeight: 48,
              padding: '0 1rem',
              borderRadius: 9999,
              border: '1px solid var(--error-text)',
              background: 'transparent',
              color: 'var(--error-text)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t('Retry', 'আবার চেষ্টা করুন')}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Widened notice */}
          {results.widenedTo && (
            <p style={{
              background: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}>
              ℹ️ {t(
                `No results within 10 km. Widened search to ${results.widenedTo} km.`,
                `১০ কিমির মধ্যে ফলাফল নেই। ${results.widenedTo} কিমি পর্যন্ত খোঁজা হয়েছে।`
              )}
            </p>
          )}

          {/* Empty state */}
          {results.results.length === 0 ? (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }}>🔍</p>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {t('No results found', 'কোনো ফলাফল পাওয়া যায়নি')}
              </p>
              {results.reason && <p style={{ fontSize: '0.875rem' }}>{results.reason}</p>}
              <p style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}>
                {t('Try selecting a different area or exam type.', 'অন্য এলাকা বা পরীক্ষার ধরন বেছে দেখুন।')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
                {t(`${results.results.length} hospital(s) found`, `${results.results.length}টি হাসপাতাল পাওয়া গেছে`)}
              </p>
              {results.results.map((r) => (
                <HospitalCard key={r.hospital.id} result={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 680, margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading form…</p>
        </div>
      }
    >
      <FormContent />
    </Suspense>
  );
}

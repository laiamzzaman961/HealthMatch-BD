'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────────────
interface AreaItem {
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  followUpType?: 'gender' | 'exam' | 'area';
  fallbackLink?: boolean;
}

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

const EXAMPLE_QUERIES = [
  { en: 'Ultrasound for my wife near Azimpur', bn: 'আজিমপুরের কাছে স্ত্রীর জন্য আল্ট্রাসাউন্ড' },
  { en: 'X-ray, female doctor, Mirpur', bn: 'মিরপুরে মহিলা ডাক্তারের এক্স-রে' },
  { en: 'Blood test near Dhanmondi', bn: 'ধানমণ্ডির কাছে রক্ত পরীক্ষা' },
];

// ── Chat Landing Component ──────────────────────────────────────────────────
function ChatLandingContent() {
  const { t, lang } = useLanguage();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      sender: 'assistant',
      text: t(
        'Hello! I can help you find a hospital and doctor for medical tests in Dhaka. What test do you need, where, and do you prefer a female or male doctor?',
        'আসসালামু আলাইকুম! ঢাকায় আপনার প্রয়োজনীয় টেস্ট বা পরীক্ষা এবং পছন্দমতো ডাক্তার খুঁজে দিতে আমি সাহায্য করতে পারি। আপনার কী পরীক্ষা প্রয়োজন, কোন এলাকায় এবং নারী বা পুরুষ ডাক্তারের কোনো পছন্দ আছে কি?'
      ),
    },
  ]);

  // Understood fields
  const [examSlug, setExamSlug] = useState<string | null>(null);
  const [genderPref, setGenderPref] = useState<'male' | 'female' | 'any' | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);

  // Available areas
  const [areas, setAreas] = useState<AreaItem[]>([]);

  // State
  const [isTyping, setIsTyping] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResponse | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<'gender' | 'exam' | 'area' | null>(null);

  // Modal / selector picker for chips
  const [editingChip, setEditingChip] = useState<'exam' | 'gender' | 'area' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/areas')
      .then((res) => res.json())
      .then((data) => {
        if (data.areas) setAreas(data.areas);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, activeFollowUp, matchResults]);

  // When all three fields are set, trigger match
  useEffect(() => {
    if (examSlug && genderPref && areaId && !isMatching) {
      runMatch(examSlug, genderPref, areaId);
    }
  }, [examSlug, genderPref, areaId]);

  const runMatch = async (exam: string, gender: 'male' | 'female' | 'any', area: string) => {
    setIsMatching(true);
    setMatchResults(null);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSlug: exam, genderPref: gender, areaId: area }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatchResults(data);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: t(
              'Could not find matching results. Please try another area or exam.',
              'কোনো ফলাফল পাওয়া যায়নি। অনুগ্রহ করে অন্য এলাকা বা পরীক্ষা বেছে নিন।'
            ),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: t('An error occurred while matching. Please try again.', 'ম্যাচিং করার সময় একটি সমস্যা হয়েছে।'),
        },
      ]);
    } finally {
      setIsMatching(false);
    }
  };

  const checkNextMissingField = (
    currentExam: string | null,
    currentGender: 'male' | 'female' | 'any' | null,
    currentArea: string | null
  ) => {
    if (!currentExam) {
      setActiveFollowUp('exam');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: t('Which medical test or exam do you need?', 'আপনার কোন মেডিকেল পরীক্ষাটি প্রয়োজন?'),
          followUpType: 'exam',
        },
      ]);
      return;
    }

    if (!currentGender) {
      setActiveFollowUp('gender');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: t('Do you have a doctor gender preference?', 'ডাক্তারের লিঙ্গ নিয়ে আপনার কোনো পছন্দ আছে কি?'),
          followUpType: 'gender',
        },
      ]);
      return;
    }

    if (!currentArea) {
      setActiveFollowUp('area');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: t('Which area in Dhaka is convenient for you?', 'ঢাকার কোন এলাকাটি আপনার জন্য সুবিধাজনক?'),
          followUpType: 'area',
        },
      ]);
      return;
    }

    setActiveFollowUp(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    setInput('');
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: query }]);
    setIsTyping(true);

    // 10-second timeout for model fallback
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: t(
            'Our assistant is busy, please use the form below.',
            'আমাদের সহকারী ব্যস্ত রয়েছে, দয়া করে নিচের ফর্মটি ব্যবহার করুন।'
          ),
          fallbackLink: true,
        },
      ]);
    }, 10000);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, lang }),
      });

      clearTimeout(timeoutId);
      if (timedOut) return;

      const data = await res.json();
      setIsTyping(false);

      if (data.fallback && data.fallbackMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            sender: 'assistant',
            text: t(data.fallbackMessage, 'আমাদের সহকারী ব্যস্ত রয়েছে, দয়া করে নিচের ফর্মটি ব্যবহার করুন।'),
            fallbackLink: true,
          },
        ]);
      }

      if (data.success && data.parsed) {
        const { examSlug: parsedExam, genderPref: parsedGender, areaId: parsedArea } = data.parsed;

        const newExam = parsedExam || examSlug;
        const newGender = parsedGender || genderPref;
        const newArea = parsedArea || areaId;

        if (parsedExam && !examSlug) setExamSlug(parsedExam);
        if (parsedGender && !genderPref) setGenderPref(parsedGender);
        if (parsedArea && !areaId) setAreaId(parsedArea);

        checkNextMissingField(newExam, newGender, newArea);
      } else {
        checkNextMissingField(examSlug, genderPref, areaId);
      }
    } catch {
      clearTimeout(timeoutId);
      if (!timedOut) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            sender: 'assistant',
            text: t(
              'Our assistant is busy, please use the form below.',
              'আমাদের সহকারী ব্যস্ত রয়েছে, দয়া করে নিচের ফর্মটি ব্যবহার করুন।'
            ),
            fallbackLink: true,
          },
        ]);
      }
    }
  };

  const handleFollowUpSelect = (type: 'gender' | 'exam' | 'area', value: string) => {
    setActiveFollowUp(null);

    let nextExam = examSlug;
    let nextGender = genderPref;
    let nextArea = areaId;

    if (type === 'gender') {
      const g = value as 'male' | 'female' | 'any';
      setGenderPref(g);
      nextGender = g;
      const label = GENDER_OPTIONS.find((opt) => opt.value === g);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'user', text: t(label?.en || g, label?.bn || g) },
      ]);
    } else if (type === 'exam') {
      setExamSlug(value);
      nextExam = value;
      const label = EXAM_OPTIONS.find((opt) => opt.slug === value);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'user', text: t(label?.en || value, label?.bn || value) },
      ]);
    } else if (type === 'area') {
      setAreaId(value);
      nextArea = value;
      const label = areas.find((a) => a.id === value);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'user', text: t(label?.name_en || value, label?.name_bn || value) },
      ]);
    }

    checkNextMissingField(nextExam, nextGender, nextArea);
  };

  const getExamLabel = (slug: string | null) => {
    if (!slug) return null;
    const found = EXAM_OPTIONS.find((e) => e.slug === slug);
    return found ? t(found.en, found.bn) : slug;
  };

  const getGenderLabel = (g: 'male' | 'female' | 'any' | null) => {
    if (!g) return null;
    const found = GENDER_OPTIONS.find((opt) => opt.value === g);
    return found ? t(found.en, found.bn) : g;
  };

  const getAreaLabel = (id: string | null) => {
    if (!id) return null;
    const found = areas.find((a) => a.id === id);
    return found ? t(found.name_en, found.name_bn) : id;
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      {/* Headline & Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontWeight: 700,
            fontSize: '1.75rem',
            color: 'var(--text-primary)',
            marginBottom: '0.375rem',
          }}
        >
          {t('Find the right doctor, comfortably', 'স্বস্তিতে খুঁজুন সঠিক ডাক্তার')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
          {t('Tell me what test you need, in Bangla or English.', 'বাংলা বা ইংরেজিতে লিখুন আপনার কী পরীক্ষা প্রয়োজন।')}
        </p>
      </div>

      {/* Main Chat Card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        }}
      >
        {/* Editable Chips Bar */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            {t('Filters:', 'ফিল্টার:')}
          </span>

          {/* Exam Chip */}
          {examSlug ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'var(--tint)',
                border: '1px solid var(--primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <span>🔬 {getExamLabel(examSlug)}</span>
              <button
                onClick={() => { setExamSlug(null); setMatchResults(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 2px' }}
                aria-label="Remove exam"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingChip('exam')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'transparent',
                border: '1px dashed var(--border)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ＋ {t('Choose exam', 'পরীক্ষা নির্বাচন')}
            </button>
          )}

          {/* Gender Chip */}
          {genderPref ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'var(--tint)',
                border: '1px solid var(--primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <span>👤 {getGenderLabel(genderPref)}</span>
              <button
                onClick={() => { setGenderPref(null); setMatchResults(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 2px' }}
                aria-label="Remove gender"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingChip('gender')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'transparent',
                border: '1px dashed var(--border)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ＋ {t('Choose gender', 'লিঙ্গ নির্বাচন')}
            </button>
          )}

          {/* Area Chip */}
          {areaId ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'var(--tint)',
                border: '1px solid var(--primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <span>📍 {getAreaLabel(areaId)}</span>
              <button
                onClick={() => { setAreaId(null); setMatchResults(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0 2px' }}
                aria-label="Remove area"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingChip('area')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'transparent',
                border: '1px dashed var(--border)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ＋ {t('Choose area', 'এলাকা নির্বাচন')}
            </button>
          )}
        </div>

        {/* Modal / Selector popup for manual chip picking */}
        {editingChip && (
          <div
            style={{
              padding: '0.875rem 1rem',
              background: 'var(--tint)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {editingChip === 'exam' && t('Select Exam / Test:', 'পরীক্ষা বেছে নিন:')}
                {editingChip === 'gender' && t('Select Doctor Gender:', 'ডাক্তারের লিঙ্গ বেছে নিন:')}
                {editingChip === 'area' && t('Select Area in Dhaka:', 'ঢাকার এলাকা বেছে নিন:')}
              </span>
              <button
                onClick={() => setEditingChip(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {editingChip === 'exam' &&
                EXAM_OPTIONS.map((e) => (
                  <button
                    key={e.slug}
                    onClick={() => {
                      setExamSlug(e.slug);
                      setEditingChip(null);
                    }}
                    style={chipButtonStyle(examSlug === e.slug)}
                  >
                    {t(e.en, e.bn)}
                  </button>
                ))}

              {editingChip === 'gender' &&
                GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => {
                      setGenderPref(g.value as 'male' | 'female' | 'any');
                      setEditingChip(null);
                    }}
                    style={chipButtonStyle(genderPref === g.value)}
                  >
                    {t(g.en, g.bn)}
                  </button>
                ))}

              {editingChip === 'area' &&
                areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAreaId(a.id);
                      setEditingChip(null);
                    }}
                    style={chipButtonStyle(areaId === a.id)}
                  >
                    {t(a.name_en, a.name_bn)}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        <div
          style={{
            padding: '1.25rem 1rem',
            minHeight: 280,
            maxHeight: 460,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: 16,
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  background: m.sender === 'user' ? 'var(--primary)' : 'var(--tint)',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
                }}
              >
                <p style={{ margin: 0 }}>{m.text}</p>

                {/* Fallback button if model failed */}
                {m.fallbackLink && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link
                      href={`/form?exam=${examSlug || ''}&gender=${genderPref || ''}&area=${areaId || ''}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        minHeight: 48,
                        padding: '0 1rem',
                        borderRadius: 9999,
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {t('Open Simple Form with pre-filled fields →', 'সহজ ফর্ম খুলুন →')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Three-dot typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 16,
                  background: 'var(--tint)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animationDelay: '0.2s' }} />
                <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          {/* Fixed follow-up prompt with big buttons (UI Flow Rule 5) */}
          {activeFollowUp && !isTyping && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {activeFollowUp === 'gender' && t('Please choose doctor gender preference:', 'ডাক্তারের লিঙ্গ বেছে নিন:')}
                {activeFollowUp === 'exam' && t('Please choose the medical exam needed:', 'প্রয়োজনীয় পরীক্ষাটি বেছে নিন:')}
                {activeFollowUp === 'area' && t('Please choose your area in Dhaka:', 'ঢাকার এলাকাটি বেছে নিন:')}
              </span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {activeFollowUp === 'gender' &&
                  GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFollowUpSelect('gender', opt.value)}
                      style={followUpButtonStyle}
                    >
                      {t(opt.en, opt.bn)}
                    </button>
                  ))}

                {activeFollowUp === 'exam' &&
                  EXAM_OPTIONS.map((opt) => (
                    <button
                      key={opt.slug}
                      onClick={() => handleFollowUpSelect('exam', opt.slug)}
                      style={followUpButtonStyle}
                    >
                      {t(opt.en, opt.bn)}
                    </button>
                  ))}

                {activeFollowUp === 'area' &&
                  areas.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleFollowUpSelect('area', a.id)}
                      style={followUpButtonStyle}
                    >
                      {t(a.name_en, a.name_bn)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '0.875rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('Type your request in English or Bangla…', 'আপনার প্রয়োজন বাংলায় বা ইংরেজিতে লিখুন…')}
              style={{
                flex: 1,
                minHeight: 48,
                padding: '0 1.25rem',
                borderRadius: 9999,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none',
              }}
            />

            {/* Hidden microphone button (reserved space for later phase per UI Flow) */}
            <button
              type="button"
              style={{ display: 'none' }}
              aria-label="Voice input"
              disabled
            >
              🎤
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              style={{
                minHeight: 48,
                minWidth: 48,
                padding: '0 1.25rem',
                borderRadius: 9999,
                background: 'var(--primary)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || isTyping ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
              }}
            >
              <span>{t('Send', 'পাঠান')}</span>
              <span>➤</span>
            </button>
          </form>

          {/* Three tappable example chips below input */}
          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('Try:', 'উদাহরণ:')}
            </span>
            {EXAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(t(q.en, q.bn))}
                style={{
                  minHeight: 36,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'var(--tint)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {t(q.en, q.bn)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matching Results Section */}
      {isMatching && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            {t('Finding verified doctors and hospitals…', 'যাচাইকৃত ডাক্তার ও হাসপাতাল খোঁজা হচ্ছে…')}
          </p>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div className="skeleton" style={{ height: 24, width: '50%' }} />
              <div className="skeleton" style={{ height: 16, width: '35%' }} />
              <div className="skeleton" style={{ height: 32, width: '80%' }} />
            </div>
          ))}
        </div>
      )}

      {matchResults && (
        <div style={{ marginTop: '2rem' }}>
          {/* Health safety notice - Hard Rule 10 */}
          <div
            style={{
              background: 'var(--tint)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <span>🛡️</span>
            <span>
              {t(
                'Health safety note: HealthMatch BD helps find providers only. It provides no medical diagnosis or health advice.',
                'স্বাস্থ্য নিরাপত্তা বিজ্ঞপ্তি: হেলথম্যাচ বিডি শুধুমাত্র তথ্য দেয়। এটি কোনো চিকিৎসা পরামর্শ বা রোগ নির্ণয় প্রদান করে না।'
              )}
            </span>
          </div>

          {/* Search Radius Widened Banner */}
          {matchResults.widenedTo && (
            <p
              style={{
                background: 'var(--warning-bg)',
                color: 'var(--warning-text)',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              ℹ️ {t(
                `No results within 10 km. Widened search to ${matchResults.widenedTo} km.`,
                `১০ কিমির মধ্যে ফলাফল নেই। ${matchResults.widenedTo} কিমি পর্যন্ত খোঁজা হয়েছে।`
              )}
            </p>
          )}

          {/* Empty Results State */}
          {matchResults.results.length === 0 ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🔍</p>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {t('No results found', 'কোনো ফলাফল পাওয়া যায়নি')}
              </h3>
              {matchResults.reason && <p style={{ fontSize: '0.875rem' }}>{matchResults.reason}</p>}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setEditingChip('gender')}
                  style={{
                    minHeight: 48,
                    padding: '0 1rem',
                    borderRadius: 9999,
                    border: '1px solid var(--primary)',
                    background: 'var(--tint)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t('Change gender preference', 'লিঙ্গ পছন্দ পরিবর্তন করুন')}
                </button>
                <button
                  onClick={() => setEditingChip('area')}
                  style={{
                    minHeight: 48,
                    padding: '0 1rem',
                    borderRadius: 9999,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t('Change area', 'এলাকা পরিবর্তন করুন')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
                {t(
                  `${matchResults.results.length} hospital(s) found near you:`,
                  `আপনার কাছাকাছি ${matchResults.results.length}টি হাসপাতাল পাওয়া গেছে:`
                )}
              </p>

              {matchResults.results.map((r) => (
                <HospitalResultCard key={r.hospital.id} result={r} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link to simple form */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link
          href="/form"
          style={{
            color: 'var(--primary)',
            fontSize: '0.9375rem',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          {t('Use the simple form instead', 'সহজ ফর্ম ব্যবহার করুন')} →
        </Link>
      </div>
    </div>
  );
}

// ── Hospital Card for Results ───────────────────────────────────────────────
function HospitalResultCard({ result }: { result: HospitalResult }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const { hospital, distanceKm, price, priceSource, priceConfirm, doctors } = result;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
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
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'var(--tint)',
            color: 'var(--primary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          {distanceKm} km
        </span>
      </div>

      {priceConfirm ? (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--warning-text)',
            background: 'var(--warning-bg)',
            padding: '6px 10px',
            borderRadius: 8,
            margin: 0,
          }}
        >
          ⚠️ {t('Price: confirm at reception.', 'মূল্য: রিসেপশনে নিশ্চিত করুন।')}
        </p>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          💵 {t('Price:', 'মূল্য:')} <strong style={{ color: 'var(--text-primary)' }}>৳{price}</strong>
          {priceSource && <span> · {priceSource}</span>}
        </p>
      )}

      {hospital.last_verified_at && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('Verified on:', 'যাচাই করা হয়েছে:')} {new Date(hospital.last_verified_at).toLocaleDateString()}
          {hospital.source ? ` · ${hospital.source}` : ''}
        </p>
      )}

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
        👨‍⚕️ {doctors.length} {t('matching doctor(s)', 'উপযুক্ত ডাক্তার')} {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
          {doctors.map((doc) => (
            <DoctorResultCard key={doc.id} doctor={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Doctor Card for Results ────────────────────────────────────────────────
function DoctorResultCard({ doctor }: { doctor: Doctor }) {
  const { t } = useLanguage();
  const todayName = DAYS_OF_WEEK[new Date().getDay()];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=doctor+${encodeURIComponent(doctor.name)}`;

  return (
    <div
      style={{
        background: 'var(--tint)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doctor.name}</span>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: 9999,
            background: doctor.gender === 'female' ? '#fce7f3' : '#dbeafe',
            color: doctor.gender === 'female' ? '#9d174d' : '#1e3a8a',
            fontWeight: 500,
          }}
        >
          {doctor.gender === 'female' ? t('Female', 'মহিলা') : t('Male', 'পুরুষ')}
        </span>
      </div>

      {doctor.visiting_days.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {doctor.visiting_days.map((day) => (
            <span
              key={day}
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 9999,
                background: day === todayName ? 'var(--primary)' : 'var(--border)',
                color: day === todayName ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: day === todayName ? 600 : 400,
              }}
            >
              {day}
            </span>
          ))}
        </div>
      )}

      {doctor.visiting_hours && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          🕐 {doctor.visiting_hours}
        </p>
      )}

      {doctor.last_verified_at && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('Verified on:', 'যাচাই:')} {new Date(doctor.last_verified_at).toLocaleDateString()}
          {doctor.source ? ` · ${doctor.source}` : ''}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        {doctor.phone && (
          <a
            href={`tel:${doctor.phone}`}
            style={actionButtonStyle('#5E9E7A', '#FFFFFF')}
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
            style={actionButtonStyle('#25D366', '#FFFFFF')}
            aria-label={`WhatsApp ${doctor.name}`}
          >
            💬 WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ── Button Styles ──────────────────────────────────────────────────────────
const followUpButtonStyle: React.CSSProperties = {
  minHeight: 48,
  padding: '0 1rem',
  borderRadius: 9999,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};

function chipButtonStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 40,
    padding: '0 0.875rem',
    borderRadius: 9999,
    border: '1px solid ' + (active ? 'var(--primary)' : 'var(--border)'),
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? '#FFFFFF' : 'var(--text-primary)',
    fontWeight: 500,
    fontSize: '0.8125rem',
    cursor: 'pointer',
  };
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

// ── Export Default with Suspense ───────────────────────────────────────────
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        </div>
      }
    >
      <ChatLandingContent />
    </Suspense>
  );
}

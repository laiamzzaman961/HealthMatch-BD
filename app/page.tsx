'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTab } from '@/contexts/TabContext';
import seedData from '@/data/seed.json';
import type {
  CustomSpeechWindow,
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '@/lib/speech-types';

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

const EXAM_OPTIONS = [
  { slug: 'usg', en: 'Ultrasonography (USG)', bn: 'আলট্রাসনোগ্রাফি' },
  { slug: 'xray', en: 'X-Ray', bn: 'এক্স-রে' },
  { slug: 'cbc', en: 'CBC Blood Test', bn: 'সিবিসি রক্ত পরীক্ষা' },
];

const GENDER_OPTIONS = [
  { value: 'female', en: 'Female doctor', bn: 'মহিলা ডাক্তার' },
  { value: 'male', en: 'Male doctor', bn: 'পুরুষ ডাক্তার' },
  { value: 'any', en: 'No preference', bn: 'যেকোনো' },
];

const EXAMPLE_QUERIES = [
  { en: 'Ultrasound for my wife near Azimpur', bn: 'আজিমপুরের কাছে স্ত্রীর জন্য আল্ট্রাসাউন্ড' },
  { en: 'X-ray, female doctor, Mirpur', bn: 'মিরপুরে মহিলা ডাক্তারের এক্স-রে' },
  { en: 'Blood test near Dhanmondi', bn: 'ধানমণ্ডির কাছে রক্ত পরীক্ষা' },
];

// ── Main Page Component ───────────────────────────────────────────────────
function HomeContent() {
  const { lang, t } = useLanguage();
  const { activeTab, setActiveTab } = useTab();

  // Chat State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [examSlug, setExamSlug] = useState<string | null>(null);
  const [genderPref, setGenderPref] = useState<'male' | 'female' | 'any' | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResponse | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<'gender' | 'exam' | 'area' | null>(null);

  // Database Exploratory State ("Show All" expansion pattern)
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');

  // Voice Input State
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Manual Form State (when activeTab === 'form')
  const [formExam, setFormExam] = useState<string>('usg');
  const [formGender, setFormGender] = useState<'male' | 'female' | 'any'>('female');
  const [formArea, setFormArea] = useState<string>('');
  const [formResults, setFormResults] = useState<MatchResponse | null>(null);
  const [isFormSearching, setIsFormSearching] = useState(false);

  // ── Initialize Greeting ─────────────────────────────────────────────────
  useEffect(() => {
    setMessages([
      {
        id: 'initial-greeting',
        sender: 'assistant',
        text:
          lang === 'bn'
            ? 'আসসালামু আলাইকুম! ঢাকায় আপনার প্রয়োজনীয় টেস্ট বা পরীক্ষা এবং পছন্দমতো ডাক্তার খুঁজে দিতে আমি সাহায্য করতে পারি। আপনার কী পরীক্ষা প্রয়োজন, কোন এলাকায় এবং নারী বা পুরুষ ডাক্তারের কোনো পছন্দ আছে কি?'
            : 'Hello! I can help you find a hospital and doctor for medical tests in Dhaka. What test do you need, where, and do you prefer a female or male doctor?',
      },
    ]);
  }, [lang]);

  // ── Fetch Areas on Mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/areas')
      .then((res) => res.json())
      .then((data) => {
        if (data.areas && Array.isArray(data.areas)) {
          setAreas(data.areas);
          if (data.areas.length > 0 && !formArea) {
            setFormArea(data.areas[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to local seed areas if network fails
        if (seedData.areas) {
          setAreas(seedData.areas);
          if (seedData.areas.length > 0 && !formArea) {
            setFormArea(seedData.areas[0].id);
          }
        }
      });
  }, []);

  // ── Detect Web Speech API Support on Mount ──────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as CustomSpeechWindow;
      const hasSpeech = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
      setIsSpeechSupported(hasSpeech);
    }
  }, []);

  // ── Stop Listening on Unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, matchResults]);

  // ── Automatic Matching when all 3 fields are identified ─────────────────
  useEffect(() => {
    if (examSlug && genderPref && areaId && !isMatching) {
      runMatch(examSlug, genderPref, areaId);
    }
  }, [examSlug, genderPref, areaId]);

  // ── Web Speech API Handler ──────────────────────────────────────────────
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      stopListening();
    }, 15000);
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = () => {
    setVoiceError(null);
    const win = window as unknown as CustomSpeechWindow;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      setVoiceError(
        lang === 'bn'
          ? 'আপনার ব্রাউজার ভয়েস রিকগনিশন সমর্থন করে না।'
          : 'Your browser does not support voice recognition.'
      );
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        resetSilenceTimer();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        resetSilenceTimer();
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const updatedText = (finalTranscript || interimTranscript).trim();
        if (updatedText) {
          setInput(updatedText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setIsListening(false);
        const err = event.error;
        if (err === 'not-allowed') {
          setVoiceError(
            lang === 'bn'
              ? 'মাইক্রোফোন ব্যবহারের অনুমতি বাতিল করা হয়েছে।'
              : 'Microphone permission denied. Please allow access.'
          );
        } else if (err === 'no-speech') {
          setVoiceError(
            lang === 'bn'
              ? 'কোনো কথা শনাক্ত করা যায়নি। আবার চেষ্টা করুন।'
              : 'No speech detected. Please speak again.'
          );
        } else if (err === 'network') {
          setVoiceError(
            lang === 'bn'
              ? 'ভয়েস রিকগনিশনে নেটওয়ার্ক সমস্যা হয়েছে।'
              : 'Network error during voice recognition.'
          );
        } else {
          setVoiceError(
            lang === 'bn'
              ? 'ভয়েস ইনপুট বিঘ্নিত হয়েছে। আবার চেষ্টা করুন।'
              : 'Voice recognition interrupted. Please try again.'
          );
        }
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError(
        lang === 'bn'
          ? 'মাইক্রোফোন চালু করা যায়নি।'
          : 'Unable to start microphone.'
      );
    }
  };

  // ── Core Matching Engine Call ───────────────────────────────────────────
  const runMatch = async (exam: string, gender: 'male' | 'female' | 'any', area: string) => {
    setIsMatching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSlug: exam, genderPref: gender, areaId: area }),
      });
      const data = await res.json();
      setMatchResults(data);

      const count = data.results ? data.results.length : 0;
      let reply = '';
      if (count > 0) {
        reply =
          lang === 'bn'
            ? `আপনার পছন্দের সাথে মিলে এমন ${count}টি হাসপাতালের তালিকা নিচে পাওয়া গেছে:`
            : `Found ${count} matching hospital(s) based on your requirements:`;
      } else {
        reply =
          data.reason ||
          (lang === 'bn'
            ? 'দুঃখিত, আপনার ফিল্টারের সাথে কোনো হাসপাতাল পাওয়া যায়নি।'
            : 'Sorry, no hospitals match your exact criteria.');
      }

      setMessages((prev) => [
        ...prev,
        { id: `match-res-${Date.now()}`, sender: 'assistant', text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `match-err-${Date.now()}`,
          sender: 'assistant',
          text:
            lang === 'bn'
              ? 'ম্যাচিং ফলাফল আনতে সাময়িক ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
              : 'Error retrieving matches. Please try again.',
        },
      ]);
    } finally {
      setIsMatching(false);
    }
  };

  // ── Send Chat Message & Parse Query ─────────────────────────────────────
  const handleSendMessage = async (textToSend?: string) => {
    const raw = typeof textToSend === 'string' ? textToSend : input;
    const text = raw.trim();
    if (!text) return;

    if (isListening) {
      stopListening();
    }

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text },
    ]);
    setInput('');
    setVoiceError(null);
    setIsTyping(true);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();

      if (data.parsed) {
        const { examSlug: pExam, genderPref: pGender, areaId: pArea } = data.parsed;
        const newExam = pExam || examSlug;
        const newGender = pGender || genderPref;
        const newArea = pArea || areaId;

        if (pExam && !examSlug) setExamSlug(pExam);
        if (pGender && !genderPref) setGenderPref(pGender);
        if (pArea && !areaId) setAreaId(pArea);

        // Check for missing criteria
        if (!newExam) {
          setActiveFollowUp('exam');
          setMessages((prev) => [
            ...prev,
            {
              id: `follow-exam-${Date.now()}`,
              sender: 'assistant',
              text:
                lang === 'bn'
                  ? 'আপনার কোন মেডিকেল পরীক্ষাটি (যেমন: আলট্রাসনোগ্রাফি, এক্স-রে, রক্ত পরীক্ষা) প্রয়োজন?'
                  : 'Which medical exam do you need (e.g. Ultrasonography, X-Ray, Blood Test)?',
              followUpType: 'exam',
            },
          ]);
        } else if (!newGender) {
          setActiveFollowUp('gender');
          setMessages((prev) => [
            ...prev,
            {
              id: `follow-gender-${Date.now()}`,
              sender: 'assistant',
              text:
                lang === 'bn'
                  ? 'আপনার কি নারী ডাক্তার, পুরুষ ডাক্তার নাকি যেকোনো চিকিৎসকের পছন্দ আছে?'
                  : 'Do you prefer a female doctor, a male doctor, or any?',
              followUpType: 'gender',
            },
          ]);
        } else if (!newArea) {
          setActiveFollowUp('area');
          setMessages((prev) => [
            ...prev,
            {
              id: `follow-area-${Date.now()}`,
              sender: 'assistant',
              text:
                lang === 'bn'
                  ? 'ঢাকার কোন এলাকায় (যেমন: ধানমণ্ডি, মিরপুর, উত্তরা) হাসপাতাল খুঁজছেন?'
                  : 'Which area in Dhaka (e.g. Dhanmondi, Mirpur, Uttara) do you prefer?',
              followUpType: 'area',
            },
          ]);
        } else {
          setActiveFollowUp(null);
          runMatch(newExam, newGender, newArea);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assist-fallback-${Date.now()}`,
            sender: 'assistant',
            text:
              lang === 'bn'
                ? 'আমি আপনার অনুসন্ধানটি পুরোপুরি বুঝতে পারিনি। পরীক্ষা, পছন্দমতো এলাকা অথবা ডাক্তারের লিঙ্গ উল্লেখ করুন।'
                : 'I could not fully understand your request. Please specify the test, area, or preferred doctor gender.',
            fallbackLink: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text:
            lang === 'bn'
              ? 'অনুরোধটি প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার লিখুন।'
              : 'Error processing your message. Please try again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Manual Form Search Handler ──────────────────────────────────────────
  const handleFormSearch = async () => {
    if (!formArea) return;
    setIsFormSearching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSlug: formExam,
          genderPref: formGender,
          areaId: formArea,
        }),
      });
      const data = await res.json();
      setFormResults(data);
    } catch {
      setFormResults({
        results: [],
        widenedTo: null,
        reason:
          lang === 'bn'
            ? 'অনুসন্ধানে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Search failed. Please try again.',
      });
    } finally {
      setIsFormSearching(false);
    }
  };

  // Helper Labels
  const getExamLabel = (slug: string | null) => {
    const f = EXAM_OPTIONS.find((e) => e.slug === slug);
    return f ? (lang === 'bn' ? f.bn : f.en) : slug;
  };
  const getGenderLabel = (g: 'male' | 'female' | 'any' | null) => {
    const f = GENDER_OPTIONS.find((o) => o.value === g);
    return f ? (lang === 'bn' ? f.bn : f.en) : g;
  };
  const getAreaLabel = (id: string | null) => {
    const f = areas.find((a) => a.id === id);
    return f ? (lang === 'bn' ? f.name_bn : f.name_en) : id;
  };

  // Filtered real database providers for exploratory section
  const realHospitals = seedData.hospitals || [];
  const realExams = seedData.exams || [];
  const realDoctors = seedData.doctors || [];

  const displayedHospitals = showAllProviders ? realHospitals : realHospitals.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 transition-colors">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW A: BENGALI MATCH CHAT (DEFAULT)                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Hero Title & Subtitle */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#010508] dark:text-white">
              {lang === 'bn' ? 'সঠিক ডাক্তার ও পরীক্ষা খুঁজুন সহজে' : 'Find the Right Test & Doctor Comfortably'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#51575D] dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'বাংলা বা ইংরেজিতে লিখুন আপনার কী পরীক্ষা প্রয়োজন, পছন্দমতো নারী/পুরুষ ডাক্তার ও এলাকা।'
                : 'Tell me what test you need, preferred doctor gender, and area in Dhaka.'}
            </p>
          </div>

          {/* Quick Example Query Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-[#51575D] dark:text-slate-400">
              {lang === 'bn' ? 'উদাহরণ:' : 'Suggestions:'}
            </span>
            {EXAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(lang === 'bn' ? q.bn : q.en)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/80 text-[#010508] dark:text-slate-200 border border-[#D1DBE0] dark:border-slate-700 hover:border-[#010508] dark:hover:border-slate-400 transition cursor-pointer shadow-sm"
              >
                {lang === 'bn' ? q.bn : q.en}
              </button>
            ))}
          </div>

          {/* Active Filter Chips Bar */}
          <div className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-md rounded-2xl p-3 border border-[#D1DBE0] dark:border-slate-800 flex flex-wrap items-center gap-2 shadow-sm">
            <span className="text-xs font-bold text-[#51575D] dark:text-slate-400">
              {lang === 'bn' ? 'ফিল্টারসমূহ:' : 'Filters:'}
            </span>

            {/* Exam Chip */}
            {examSlug ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#010508] text-white shadow-sm">
                <span>🔬 {getExamLabel(examSlug)}</span>
                <button
                  onClick={() => {
                    setExamSlug(null);
                    setMatchResults(null);
                  }}
                  className="hover:opacity-80 text-white cursor-pointer ml-1"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="text-xs text-[#51575D] dark:text-slate-400 border border-dashed border-[#D1DBE0] dark:border-slate-700 rounded-full px-3 py-1">
                ＋ {lang === 'bn' ? 'পরীক্ষা বাকি' : 'Exam unset'}
              </span>
            )}

            {/* Gender Chip */}
            {genderPref ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#010508] text-white shadow-sm">
                <span>👤 {getGenderLabel(genderPref)}</span>
                <button
                  onClick={() => {
                    setGenderPref(null);
                    setMatchResults(null);
                  }}
                  className="hover:opacity-80 text-white cursor-pointer ml-1"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="text-xs text-[#51575D] dark:text-slate-400 border border-dashed border-[#D1DBE0] dark:border-slate-700 rounded-full px-3 py-1">
                ＋ {lang === 'bn' ? 'ডাক্তার লিঙ্গ বাকি' : 'Gender unset'}
              </span>
            )}

            {/* Area Chip */}
            {areaId ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#010508] text-white shadow-sm">
                <span>📍 {getAreaLabel(areaId)}</span>
                <button
                  onClick={() => {
                    setAreaId(null);
                    setMatchResults(null);
                  }}
                  className="hover:opacity-80 text-white cursor-pointer ml-1"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="text-xs text-[#51575D] dark:text-slate-400 border border-dashed border-[#D1DBE0] dark:border-slate-700 rounded-full px-3 py-1">
                ＋ {lang === 'bn' ? 'এলাকা বাকি' : 'Area unset'}
              </span>
            )}

            {(examSlug || genderPref || areaId) && (
              <button
                onClick={() => {
                  setExamSlug(null);
                  setGenderPref(null);
                  setAreaId(null);
                  setMatchResults(null);
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline ml-auto cursor-pointer"
              >
                {lang === 'bn' ? 'সব মুছুন' : 'Reset'}
              </button>
            )}
          </div>

          {/* Main Chat Conversation Container */}
          <div className="bg-white/90 dark:bg-[#121820]/90 backdrop-blur-md rounded-[32px] p-5 sm:p-6 shadow-xl border border-white/80 dark:border-slate-800">
            {/* Messages Thread */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto p-4 bg-[#E4E9EC]/50 dark:bg-slate-900/50 rounded-[24px] mb-5 scrollbar-none">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-[22px] text-sm leading-relaxed ${
                      msg.sender === 'assistant'
                        ? 'bg-white dark:bg-slate-800 text-[#010508] dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                        : 'bg-[#010508] text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Interactive Follow-up Buttons inside Assistant Message */}
                    {msg.followUpType === 'gender' && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {GENDER_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setGenderPref(opt.value as 'male' | 'female' | 'any');
                              handleSendMessage(lang === 'bn' ? opt.bn : opt.en);
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E4E9EC] dark:bg-slate-700 text-[#010508] dark:text-white hover:bg-[#010508] hover:text-white transition cursor-pointer"
                          >
                            {lang === 'bn' ? opt.bn : opt.en}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.followUpType === 'exam' && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {EXAM_OPTIONS.map((e) => (
                          <button
                            key={e.slug}
                            onClick={() => {
                              setExamSlug(e.slug);
                              handleSendMessage(lang === 'bn' ? e.bn : e.en);
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E4E9EC] dark:bg-slate-700 text-[#010508] dark:text-white hover:bg-[#010508] hover:text-white transition cursor-pointer"
                          >
                            {lang === 'bn' ? e.bn : e.en}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.followUpType === 'area' && areas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {areas.slice(0, 6).map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              setAreaId(a.id);
                              handleSendMessage(lang === 'bn' ? a.name_bn : a.name_en);
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E4E9EC] dark:bg-slate-700 text-[#010508] dark:text-white hover:bg-[#010508] hover:text-white transition cursor-pointer"
                          >
                            {lang === 'bn' ? a.name_bn : a.name_en}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 text-[#51575D] dark:text-slate-300 p-3 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="typing-dot">●</span>
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                    <span className="ml-1 font-medium">{lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Analyzing...'}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar with Native Web Speech API Mic Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-[#121820] border border-[#D1DBE0] dark:border-slate-700 rounded-full px-4 sm:px-5 py-2.5 shadow-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: ধানমণ্ডিতে আল্ট্রাসনোগ্রাফির জন্য মহিলা ডাক্তার খুঁজছি...'
                      : 'Type your test, area, or preferred doctor gender...'
                  }
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[#010508] dark:text-white placeholder:text-[#51575D] dark:placeholder:text-slate-500"
                />

                {/* Native Web Speech API Mic Button */}
                {isSpeechSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                    title={
                      isListening
                        ? lang === 'bn'
                          ? 'শুনছি... বন্ধ করতে চাপুন'
                          : 'Listening... Click to stop'
                        : lang === 'bn'
                        ? 'ভয়েস দিয়ে লিখুন'
                        : 'Voice Input'
                    }
                    className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition cursor-pointer ${
                      isListening
                        ? 'bg-red-600 text-white mic-active'
                        : 'bg-[#E4E9EC] dark:bg-slate-800 text-[#010508] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isListening ? (
                      <span className="text-xs font-black">⏹</span>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  className="bg-[#010508] hover:bg-[#191D1F] text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                >
                  {lang === 'bn' ? 'পাঠান' : 'Send'}
                </button>
              </div>

              {/* Listening & Privacy Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#51575D] dark:text-slate-400 px-3 gap-1">
                {isListening ? (
                  <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    {lang === 'bn' ? 'শুনছি... কথা বলুন' : 'Listening... Speak now'}
                  </span>
                ) : (
                  <span>
                    🔒{' '}
                    {lang === 'bn'
                      ? 'ভয়েস ব্রাউজারের স্পিচ সার্ভিস দ্বারা প্রক্রিয়াকৃত হয়।'
                      : "Voice is processed locally by your browser's speech service."}
                  </span>
                )}

                {voiceError && (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    ⚠️ {voiceError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* REAL DATABASE RESULTS DISPLAY (If Match Results Available)      */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {matchResults && matchResults.results && matchResults.results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-[#010508] dark:text-white">
                {lang === 'bn' ? 'যাচাইকৃত হাসপাতাল ও ডাক্তার ফলাফল' : 'Verified Facility & Doctor Matches'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {matchResults.results.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/95 dark:bg-[#121820] backdrop-blur-md rounded-[28px] p-5 border border-white/80 dark:border-slate-800 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-extrabold text-[#010508] dark:text-white">
                            {lang === 'bn' ? item.hospital.name_bn : item.hospital.name_en}
                          </h3>
                          <p className="text-xs text-[#51575D] dark:text-slate-400 mt-0.5">
                            📍 {item.hospital.address}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E4E9EC] dark:bg-slate-800 text-[#010508] dark:text-white whitespace-nowrap">
                          {item.distanceKm.toFixed(1)} km
                        </span>
                      </div>

                      {/* Verified Price per Rule 4 */}
                      <div className="mt-3 flex items-center gap-2">
                        {item.price ? (
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            ৳{item.price.toLocaleString()} ({item.priceSource || 'Verified'})
                          </span>
                        ) : (
                          <span className="text-xs text-[#51575D] dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {lang === 'bn' ? 'মূল্য: রিসেপশনে নিশ্চিত করুন' : 'Price: confirm at reception'}
                          </span>
                        )}
                      </div>

                      {/* Matching Verified Doctors */}
                      <div className="mt-4 space-y-2">
                        <span className="text-xs font-bold text-[#51575D] dark:text-slate-400">
                          {lang === 'bn' ? 'যাচাইকৃত চিকিৎসকবৃন্দ:' : 'Verified Doctors:'}
                        </span>
                        {item.doctors.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-[#E4E9EC]/50 dark:bg-slate-800/50 rounded-2xl p-3 text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-[#010508] dark:text-white">
                                {doc.name}{' '}
                                <span className="font-normal text-[11px] text-[#51575D] dark:text-slate-400">
                                  ({doc.gender === 'female' ? (lang === 'bn' ? 'মহিলা' : 'Female') : (lang === 'bn' ? 'পুরুষ' : 'Male')})
                                </span>
                              </p>
                              <p className="text-[11px] text-[#51575D] dark:text-slate-400">
                                🕒 {doc.visiting_hours || '10:00–18:00'} ({doc.visiting_days.join(', ')})
                              </p>
                            </div>

                            {doc.phone && (
                              <a
                                href={`tel:${doc.phone}`}
                                className="bg-[#010508] dark:bg-white text-white dark:text-[#010508] px-3 py-1.5 rounded-full font-bold text-[11px] shadow-sm hover:opacity-90 transition whitespace-nowrap ml-2"
                              >
                                📞 {lang === 'bn' ? 'কল করুন' : 'Call'}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* REAL DATABASE EXPLORATORY SECTION ("SHOW ALL" PATTERN)          */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <section className="bg-white/80 dark:bg-[#121820]/80 backdrop-blur-md rounded-[32px] p-6 sm:p-7 border border-white/80 dark:border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#010508] dark:text-white tracking-tight">
                  {lang === 'bn' ? 'ঢাকার প্রকৃত হাসপাতাল ও টেস্ট ডিরেক্টরি' : 'Real Database Diagnostic Directory'}
                </h2>
                <p className="text-xs text-[#51575D] dark:text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'ডাটাবেসে সংরক্ষিত নির্ভরযোগ্য হাসপাতাল, ভেরিফাইড চিকিৎসক ও টেস্ট ফি'
                    : 'Real facilities, verified medical practitioners, and official test costs'}
                </p>
              </div>

              {/* Test Category Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedExamFilter('all')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer ${
                    selectedExamFilter === 'all'
                      ? 'bg-[#010508] text-white shadow-sm'
                      : 'bg-[#E4E9EC] dark:bg-slate-800 text-[#51575D] dark:text-slate-300'
                  }`}
                >
                  {lang === 'bn' ? 'সব টেস্ট' : 'All Tests'}
                </button>
                {realExams.map((ex) => (
                  <button
                    key={ex.slug}
                    onClick={() => setSelectedExamFilter(ex.slug)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                      selectedExamFilter === ex.slug
                        ? 'bg-[#010508] text-white shadow-sm'
                        : 'bg-[#E4E9EC] dark:bg-slate-800 text-[#51575D] dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? ex.name_bn : ex.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Real Hospitals (Preview vs Full "Show All") */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedHospitals.map((hosp) => {
                const hospDoctors = realDoctors.filter((d) => d.hospital_id === hosp.id);
                return (
                  <div
                    key={hosp.id}
                    className="bg-white dark:bg-slate-900/90 rounded-[24px] p-5 border border-[#D1DBE0] dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Official Registry
                        </span>
                        <span className="text-xs text-[#51575D] dark:text-slate-400">
                          {hospDoctors.length} {lang === 'bn' ? 'ডাক্তার' : 'Doctors'}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-[#010508] dark:text-white mt-2">
                        {lang === 'bn' ? hosp.name_bn : hosp.name_en}
                      </h3>
                      <p className="text-xs text-[#51575D] dark:text-slate-400 mt-0.5">
                        📍 {hosp.address}
                      </p>

                      {/* Verified Doctors List */}
                      <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {hospDoctors.map((d) => (
                          <div key={d.id} className="text-xs flex items-center justify-between">
                            <span className="font-semibold text-[#010508] dark:text-slate-200">
                              {d.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#51575D] dark:text-slate-400">
                              {d.gender === 'female' ? (lang === 'bn' ? 'মহিলা' : 'Female') : (lang === 'bn' ? 'পুরুষ' : 'Male')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const area = areas.find((a) => a.id === hosp.area_id);
                          const areaName = area ? (lang === 'bn' ? area.name_bn : area.name_en) : '';
                          handleSendMessage(
                            lang === 'bn'
                              ? `${areaName}-এ আল্ট্রাসনোগ্রাফি`
                              : `Ultrasound near ${areaName}`
                          );
                        }}
                        className="text-xs font-bold text-[#010508] dark:text-white hover:underline cursor-pointer"
                      >
                        {lang === 'bn' ? 'চ্যাটে খুঁজুন →' : 'Match in Chat →'}
                      </button>

                      <a
                        href={hospDoctors[0]?.phone ? `tel:${hospDoctors[0].phone}` : 'tel:+8809666787801'}
                        className="bg-[#010508] dark:bg-white text-white dark:text-[#010508] px-3.5 py-1.5 rounded-full font-bold text-xs shadow-sm hover:opacity-90 transition"
                      >
                        📞 {lang === 'bn' ? 'হটলাইন কল' : 'Call Hotline'}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "Show All" Expansion Pattern Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAllProviders(!showAllProviders)}
                className="inline-flex items-center gap-2 bg-[#010508] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold shadow-md hover:bg-[#191D1F] transition cursor-pointer"
              >
                <span>
                  {showAllProviders
                    ? lang === 'bn'
                      ? 'কম দেখুন (সংক্ষেপ করুন)'
                      : 'Show Less'
                    : lang === 'bn'
                    ? `সব দেখুন (সকল ${realHospitals.length}টি প্রতিষ্ঠান)`
                    : `Show All (${realHospitals.length} Facilities)`}
                </span>
                <span>{showAllProviders ? '▲' : '▼'}</span>
              </button>
            </div>
          </section>

          {/* Safety Disclaimer */}
          <div className="text-center text-xs text-[#51575D] dark:text-slate-400 py-3">
            <p>
              🛡️{' '}
              {lang === 'bn'
                ? 'স্বাস্থ্য সুরক্ষা সতর্কতা: হেলথম্যাচ বিডি কেবল তথ্য ও অবস্থান অনুসন্ধান সরবরাহ করে, কোনো রোগ নির্ণয় বা চিকিৎসা পরামর্শ প্রদান করে না।'
                : 'Health Safety Note: HealthMatch BD provides healthcare provider directory and location matching only; it gives no medical diagnosis or advice.'}
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW B: DATABASE FORM SEARCH                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'form' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-[#010508] dark:text-white">
              {lang === 'bn' ? 'ডাটাবেস ভিত্তিক ফর্ম সার্চ' : 'Database Form Search'}
            </h1>
            <p className="text-xs sm:text-sm text-[#51575D] dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'সরাসরি টেস্ট, ডাক্তারের লিঙ্গ ও এলাকা নির্বাচন করে নির্ভুল তথ্য পান।'
                : 'Select test, doctor gender, and Dhaka area for exact database lookup.'}
            </p>
          </div>

          <div className="bg-white/90 dark:bg-[#121820]/90 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-white/80 dark:border-slate-800 shadow-xl space-y-5">
            {/* 1. Exam Selector */}
            <div>
              <label className="block text-xs font-extrabold text-[#51575D] dark:text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'bn' ? '১. পরীক্ষা / টেস্ট নির্বাচন করুন' : '1. Select Exam / Medical Test'}
              </label>
              <select
                value={formExam}
                onChange={(e) => setFormExam(e.target.value)}
                className="w-full bg-[#E4E9EC] dark:bg-slate-800 border border-[#D1DBE0] dark:border-slate-700 rounded-2xl p-3.5 text-sm font-semibold text-[#010508] dark:text-white outline-none"
              >
                {EXAM_OPTIONS.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {lang === 'bn' ? e.bn : e.en}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Gender Preference */}
            <div>
              <label className="block text-xs font-extrabold text-[#51575D] dark:text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'bn' ? '২. ডাক্তারের লিঙ্গ পছন্দ (কঠোর ফিল্টার)' : '2. Doctor Gender Preference (Strict)'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormGender(opt.value as 'male' | 'female' | 'any')}
                    className={`py-3 px-2 rounded-2xl text-xs font-bold transition text-center cursor-pointer ${
                      formGender === opt.value
                        ? 'bg-[#010508] text-white shadow-md'
                        : 'bg-[#E4E9EC] dark:bg-slate-800 text-[#51575D] dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? opt.bn : opt.en}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Area Selector */}
            <div>
              <label className="block text-xs font-extrabold text-[#51575D] dark:text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'bn' ? '৩. ঢাকার এলাকা নির্বাচন করুন' : '3. Select Area in Dhaka'}
              </label>
              <select
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
                className="w-full bg-[#E4E9EC] dark:bg-slate-800 border border-[#D1DBE0] dark:border-slate-700 rounded-2xl p-3.5 text-sm font-semibold text-[#010508] dark:text-white outline-none"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {lang === 'bn' ? a.name_bn : a.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleFormSearch}
              disabled={isFormSearching}
              className="w-full bg-[#010508] hover:bg-[#191D1F] text-white py-4 rounded-full font-extrabold text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isFormSearching ? (
                <span>{lang === 'bn' ? 'অনুসন্ধান চলছে...' : 'Searching...'}</span>
              ) : (
                <span>{lang === 'bn' ? 'হাসপাতাল ও ডাক্তার অনুসন্ধান করুন' : 'Search Matching Facilities'}</span>
              )}
            </button>
          </div>

          {/* Form Search Results */}
          {formResults && (
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-[#010508] dark:text-white">
                {lang === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Search Results'}
              </h2>

              {formResults.results.length === 0 ? (
                <div className="bg-white/90 dark:bg-[#121820]/90 p-6 rounded-3xl text-center text-sm text-[#51575D] dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                  {formResults.reason || (lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি।' : 'No matches found.')}
                </div>
              ) : (
                <div className="space-y-4">
                  {formResults.results.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white/95 dark:bg-[#121820] rounded-[28px] p-5 border border-white/80 dark:border-slate-800 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-base text-[#010508] dark:text-white">
                            {lang === 'bn' ? item.hospital.name_bn : item.hospital.name_en}
                          </h3>
                          <p className="text-xs text-[#51575D] dark:text-slate-400 mt-0.5">
                            📍 {item.hospital.address}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 bg-[#E4E9EC] dark:bg-slate-800 rounded-full">
                          {item.distanceKm.toFixed(1)} km
                        </span>
                      </div>

                      <div className="mt-3">
                        {item.price ? (
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            ৳{item.price.toLocaleString()} ({item.priceSource || 'Verified'})
                          </span>
                        ) : (
                          <span className="text-xs text-[#51575D] dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {lang === 'bn' ? 'মূল্য: রিসেপশনে নিশ্চিত করুন' : 'Price: confirm at reception'}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        {item.doctors.map((d) => (
                          <div
                            key={d.id}
                            className="bg-[#E4E9EC]/50 dark:bg-slate-800/50 rounded-2xl p-3 text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-[#010508] dark:text-white">
                                {d.name} ({d.gender === 'female' ? (lang === 'bn' ? 'মহিলা' : 'Female') : (lang === 'bn' ? 'পুরুষ' : 'Male')})
                              </p>
                              <p className="text-[11px] text-[#51575D] dark:text-slate-400">
                                🕒 {d.visiting_hours} ({d.visiting_days.join(', ')})
                              </p>
                            </div>
                            {d.phone && (
                              <a
                                href={`tel:${d.phone}`}
                                className="bg-[#010508] dark:bg-white text-white dark:text-[#010508] px-3.5 py-1.5 rounded-full font-bold text-xs"
                              >
                                📞 {lang === 'bn' ? 'কল করুন' : 'Call'}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#D1DBE0] dark:bg-[#0F172A] flex items-center justify-center font-bold text-[#010508] dark:text-white">
          Loading HealthMatch BD...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

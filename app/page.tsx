'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────
interface DoctorData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  category: 'Cardiology' | 'Neurology' | 'General' | 'Urology';
  rate: number;
  rating: number;
  reviewCount: number;
  patients: string;
  experience: string;
  hospital: string;
  location: string;
  isOnline: boolean;
  initials: string;
  gender: 'female' | 'male';
  about: string;
  themeColor: string;
  themeBg: string;
}

// ── Doctors Dataset (NO REAL PHOTOS — Pure Vector Avatars & Badges) ─────────
const DOCTORS: DoctorData[] = [
  {
    id: 'amara-patel',
    name: 'Dr. Amara Patel',
    title: 'Internal Medicine Specialist',
    specialty: 'Internal Medicine',
    category: 'General',
    rate: 90,
    rating: 4.9,
    reviewCount: 184,
    patients: '200+',
    experience: '8+ Years',
    hospital: 'Evercare Hospital Dhaka',
    location: 'Bashundhara R/A, Dhaka',
    isOnline: true,
    initials: 'AP',
    gender: 'female',
    about: 'Dr. Patel specializes in preventive care and chronic condition management, with a warm, collaborative approach to diagnosis and long-term health monitoring.',
    themeColor: '#0D9488',
    themeBg: '#CCFBF1',
  },
  {
    id: 'davis-dias',
    name: 'Dr. Davis Dias',
    title: 'Senior Urologist & Surgeon',
    specialty: 'Urology',
    category: 'Urology',
    rate: 95,
    rating: 4.8,
    reviewCount: 142,
    patients: '350+',
    experience: '10+ Years',
    hospital: 'Square Hospitals Ltd',
    location: 'Panthapath, Dhaka',
    isOnline: true,
    initials: 'DD',
    gender: 'male',
    about: 'Dr. Dias is an internationally trained urological specialist focusing on renal ultrasound, minimally invasive therapies, and compassionate patient consultations.',
    themeColor: '#7C3AED',
    themeBg: '#EDE9FE',
  },
  {
    id: 'farhana-rahman',
    name: 'Dr. Farhana Rahman',
    title: 'Senior Consultant Cardiologist',
    specialty: 'Cardiology',
    category: 'Cardiology',
    rate: 110,
    rating: 4.95,
    reviewCount: 260,
    patients: '500+',
    experience: '12+ Years',
    hospital: 'United Hospital',
    location: 'Gulshan-2, Dhaka',
    isOnline: true,
    initials: 'FR',
    gender: 'female',
    about: 'Dr. Rahman focuses on non-invasive clinical cardiology, advanced echocardiography, and preventive heart wellness for patients across Bangladesh.',
    themeColor: '#E11D48',
    themeBg: '#FFE4E6',
  },
  {
    id: 'tariqul-islam',
    name: 'Dr. Tariqul Islam',
    title: 'Consultant Neurologist',
    specialty: 'Neurology',
    category: 'Neurology',
    rate: 100,
    rating: 4.85,
    reviewCount: 198,
    patients: '280+',
    experience: '9+ Years',
    hospital: 'Labaid Specialized Hospital',
    location: 'Dhanmondi, Dhaka',
    isOnline: true,
    initials: 'TI',
    gender: 'male',
    about: 'Leading neurologist dedicated to early neuro-diagnostic assessment, migraine intervention, and patient-centered rehabilitation pathways.',
    themeColor: '#2563EB',
    themeBg: '#DBEAFE',
  },
  {
    id: 'nusrat-jahan',
    name: 'Dr. Nusrat Jahan',
    title: 'Consultant Sonologist & Radiologist',
    specialty: 'General / Radiology',
    category: 'General',
    rate: 85,
    rating: 4.92,
    reviewCount: 310,
    patients: '420+',
    experience: '11+ Years',
    hospital: 'Popular Diagnostic Centre',
    location: 'Dhanmondi, Dhaka',
    isOnline: false,
    initials: 'NJ',
    gender: 'female',
    about: 'Expert in high-resolution ultrasonography, Doppler scans, and maternal-fetal imaging with gentle, patient-first bedside care.',
    themeColor: '#D97706',
    themeBg: '#FEF3C7',
  },
  {
    id: 'kabir-ahmed',
    name: 'Dr. Kabir Ahmed',
    title: 'Consultant Orthopedic Surgeon',
    specialty: 'Orthopedics & Surgery',
    category: 'Urology',
    rate: 105,
    rating: 4.88,
    reviewCount: 215,
    patients: '310+',
    experience: '14+ Years',
    hospital: 'National Orthopedic Hospital',
    location: 'Sher-e-Bangla Nagar, Dhaka',
    isOnline: true,
    initials: 'KA',
    gender: 'male',
    about: 'Renowned consultant for joint reconstruction, arthroscopic diagnostics, and comprehensive musculoskeletal wellness.',
    themeColor: '#059669',
    themeBg: '#D1FAE5',
  },
];

// ── Specialist Categories ──────────────────────────────────────────────────
const SPECIALIST_CATEGORIES = [
  { id: 'cardiology', name: 'Cardiology', color: '#EF4444', bg: '#FEE2E2', icon: 'heart' },
  { id: 'neurology', name: 'Neurology', color: '#3B82F6', bg: '#DBEAFE', icon: 'brain' },
  { id: 'general', name: 'General', color: '#10B981', bg: '#D1FAE5', icon: 'cross' },
  { id: 'urology', name: 'Urology', color: '#8B5CF6', bg: '#EDE9FE', icon: 'clinic' },
];

const CALENDAR_DAYS = [
  { dayNum: '15', dayName: 'Sun' },
  { dayNum: '16', dayName: 'Mon' },
  { dayNum: '17', dayName: 'Tue' },
  { dayNum: '18', dayName: 'Wed' },
  { dayNum: '19', dayName: 'Thu' },
  { dayNum: '20', dayName: 'Fri' },
  { dayNum: '21', dayName: 'Sat' },
];

const TIME_SLOTS = [
  '10:30 AM',
  '11:15 AM',
  '02:00 PM',
  '03:30 PM',
  '04:15 PM',
  '04:45 PM',
];

// ── Clean Vector Medical & UI Icons ────────────────────────────────────────
function StethoscopeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h3v5a4 4 0 0 1-8 0V3h3" />
      <path d="M7.5 8a4 4 0 0 0 8 0V3h-3" />
      <path d="M11.5 12a4.5 4.5 0 0 0 9 0V9h-2" />
      <circle cx="18.5" cy="9" r="1.5" fill="currentColor" />
      <path d="M7 16a5 5 0 0 0 10 0" />
    </svg>
  );
}

function HeartPulseIcon({ color = '#EF4444' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill={color} fillOpacity="0.15" />
      <path d="M3.22 12H9.5l1.5-3 2.5 6 1.5-3h5.78" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function BrainIcon({ color = '#3B82F6' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04Z" fill={color} fillOpacity="0.15" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04Z" fill={color} fillOpacity="0.15" />
    </svg>
  );
}

function MedicalCrossIcon({ color = '#10B981' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
      <path d="M12 7v10" strokeWidth="2.5" />
      <path d="M7 12h10" strokeWidth="2.5" />
    </svg>
  );
}

function ClinicIcon({ color = '#8B5CF6' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" fill={color} fillOpacity="0.12" />
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
      <path d="M10 9h4" strokeWidth="2.5" />
      <path d="M12 7v4" strokeWidth="2.5" />
    </svg>
  );
}

function FilterSlidersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

// ── Minimalist Vector Doctor Avatar (NO REAL PHOTOS) ────────────────────────
function DoctorVectorAvatar({
  doctor,
  size = 'md',
}: {
  doctor: DoctorData;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  }[size];

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18',
  }[size];

  return (
    <div className={`relative flex items-center justify-center rounded-3xl transition-transform ${sizeClasses}`} style={{ backgroundColor: doctor.themeBg }}>
      {/* Background Subtle Gradient Rings */}
      <div
        className="absolute inset-0 rounded-3xl opacity-30"
        style={{
          background: `radial-gradient(circle at top right, ${doctor.themeColor}, transparent)`,
        }}
      />

      {/* Doctor Silhouette & Medical Emblems */}
      <div className="relative flex flex-col items-center justify-center text-center select-none" style={{ color: doctor.themeColor }}>
        <svg className={iconSizes} viewBox="0 0 24 24" fill="currentColor">
          {doctor.gender === 'female' ? (
            // Female Doctor Silhouette with Stethoscope
            <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.9.95 3.55 2.4 4.5C6.8 11.8 4 14.5 4 18v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2c0-3.5-2.8-6.2-5.9-6.9 1.45-.95 2.4-2.6 2.4-4.5A4.5 4.5 0 0 0 12 2zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-5 15c.3-2.6 2.3-4.5 5-4.5s4.7 1.9 5 4.5H7z" />
          ) : (
            // Male Doctor Silhouette with Lab Coat
            <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 2 1.3 3.7 3.1 4.3C7.2 11.6 5 14.5 5 18v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2c0-3.5-2.2-6.4-5.6-7.2 1.8-.6 3.1-2.3 3.1-4.3A4.5 4.5 0 0 0 12 2zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-5 15c.4-2.5 2.4-4.5 5-4.5s4.6 2 5 4.5H7z" />
          )}
        </svg>

        {/* Monogram Badge */}
        {size !== 'sm' && (
          <span className="text-[10px] font-black tracking-widest uppercase opacity-90 mt-0.5">
            {doctor.initials}
          </span>
        )}
      </div>

      {/* Online Pulsing Indicator Dot */}
      {doctor.isOnline && (
        <span className="absolute bottom-1 right-1 flex items-center justify-center">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
        </span>
      )}
    </div>
  );
}

// ── Main Minimalist Healthcare Discovery App ──────────────────────────────
function ModernMinimalistApp() {
  // View State (Screen A: Home, Screen B: Profile, Screen C: Booking)
  const [currentScreen, setCurrentScreen] = useState<'A' | 'B' | 'C'>('A');

  // Selected State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorData>(DOCTORS[0]);
  const [activeFilter, setActiveFilter] = useState<string>('available');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('all');
  const [activeProfileTab, setActiveProfileTab] = useState<'about' | 'reviews' | 'availability'>('about');
  const [selectedDate, setSelectedDate] = useState<string>('18');
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [showBookingConfirmed, setShowBookingConfirmed] = useState<boolean>(false);

  // Filter Doctors dynamically
  const filteredDoctors = DOCTORS.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialist =
      selectedSpecialist === 'all' || doc.category.toLowerCase() === selectedSpecialist.toLowerCase();
    const matchesFilter =
      activeFilter === 'available'
        ? doc.isOnline
        : activeFilter === 'rating'
        ? doc.rating >= 4.9
        : true;
    return matchesSearch && matchesSpecialist && matchesFilter;
  });

  const handleSelectDoctor = (doc: DoctorData) => {
    setSelectedDoctor(doc);
    setCurrentScreen('B');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookAppointment = () => {
    setCurrentScreen('C');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBooking = () => {
    setShowBookingConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D1DBE0] via-[#DCE3E7] to-[#E4E9EC] text-[#010508] relative font-sans antialiased pb-28 pt-4">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SCREEN A: DISCOVERY & SEARCH (HOME)                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'A' && (
        <section aria-label="Doctor Discovery" className="max-w-5xl mx-auto px-4 sm:px-6 animate-in fade-in duration-300">
          {/* Header & User Badge */}
          <div className="flex items-center justify-between mb-5 mt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#010508]">
                Find a doctor
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#51575D] mt-0.5">
                Personal care, whenever you need it
              </p>
            </div>

            {/* Clean User Badge Placeholder with Pulsing Status */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-sm border border-white/80">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#010508" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>
          </div>

          {/* Full-width Pill-Shaped Search Bar */}
          <div className="relative flex items-center mb-5">
            <div className="absolute left-5 text-[#51575D]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor or specialty"
              className="w-full bg-white shadow-sm text-sm sm:text-base text-[#010508] placeholder:text-[#51575D] rounded-full py-4 pl-13 pr-14 border border-[#D1DBE0] focus:outline-none focus:ring-2 focus:ring-[#010508]/20 transition"
            />
            <button
              aria-label="Filter options"
              className="absolute right-3 p-2.5 bg-[#E4E9EC]/80 hover:bg-[#E4E9EC] text-[#010508] rounded-full transition flex items-center justify-center cursor-pointer shadow-sm"
            >
              <FilterSlidersIcon />
            </button>
          </div>

          {/* Horizontal Scrolling Filter Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none mb-7 -mx-1 px-1">
            {[
              { id: 'available', label: 'Available today' },
              { id: 'video', label: 'Video' },
              { id: 'rating', label: '4.5+ rating' },
              { id: 'all', label: 'All Doctors' },
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilter(chip.id)}
                  className={`text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full whitespace-nowrap transition cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#010508] text-white shadow-sm'
                      : 'bg-white/85 text-[#51575D] hover:bg-white border border-[#D1DBE0]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Top Specialists Grid Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#010508]">
                Top specialists
              </h2>
              <button
                onClick={() => setSelectedSpecialist('all')}
                className="text-xs font-bold text-[#51575D] hover:text-[#010508] transition cursor-pointer"
              >
                See all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {SPECIALIST_CATEGORIES.map((s) => {
                const isSelected = selectedSpecialist.toLowerCase() === s.name.toLowerCase();
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSpecialist(isSelected ? 'all' : s.name)}
                    className={`bg-white/90 backdrop-blur-md rounded-[28px] p-4 flex flex-col items-center justify-center gap-2.5 border transition cursor-pointer hover:shadow-md active:scale-95 ${
                      isSelected ? 'border-[#010508] ring-2 ring-[#010508]/15 shadow-sm' : 'border-white/80'
                    }`}
                  >
                    <div
                      className="w-13 h-13 rounded-2xl flex items-center justify-center transition"
                      style={{ backgroundColor: s.bg }}
                    >
                      {s.icon === 'heart' && <HeartPulseIcon color={s.color} />}
                      {s.icon === 'brain' && <BrainIcon color={s.color} />}
                      {s.icon === 'cross' && <MedicalCrossIcon color={s.color} />}
                      {s.icon === 'clinic' && <ClinicIcon color={s.color} />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#010508] text-center">
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Doctors List (NO REAL PHOTOS — Vector Badges & Cards) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#010508]">
                Recommended for you
              </h2>
              <span className="text-xs font-bold text-[#51575D]">
                {filteredDoctors.length} doctors found
              </span>
            </div>

            {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoctor(doc)}
                  className="group relative bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[36px] overflow-hidden border border-white/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Vector Banner with Specialty Badge & Online Dot */}
                  <div className="flex items-start justify-between mb-4">
                    <DoctorVectorAvatar doctor={doc} size="lg" />

                    <div className="flex flex-col items-end gap-1.5">
                      {/* Rating pill */}
                      <div className="bg-[#010508] text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <span className="text-amber-400">★</span>
                        <span>{doc.rating}</span>
                      </div>

                      {/* Online Status Pill */}
                      {doc.isOnline && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor Details */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#010508] tracking-tight group-hover:text-[#191D1F] transition">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#51575D] mt-0.5">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-[#51575D] mt-1 truncate">
                      📍 {doc.hospital}
                    </p>
                  </div>

                  {/* Pricing and Action Button Row */}
                  <div className="mt-4 pt-3 border-t border-[#E4E9EC] flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-[#010508]">
                        ${doc.rate}
                      </span>
                      <span className="text-xs text-[#51575D] ml-1">/ hour</span>
                    </div>

                    <button
                      aria-label={`View profile of ${doc.name}`}
                      className="w-10 h-10 rounded-full bg-[#010508] text-white flex items-center justify-center group-hover:bg-[#191D1F] group-hover:scale-105 transition shadow-sm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SCREEN B: DOCTOR PROFILE & BIO VIEW                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'B' && (
        <section aria-label="Doctor Profile" className="max-w-3xl mx-auto px-4 sm:px-6 animate-in fade-in duration-300">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between mb-5 mt-1">
            <button
              onClick={() => setCurrentScreen('A')}
              aria-label="Back to discovery"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-[#010508] flex items-center justify-center shadow-sm border border-[#D1DBE0] transition cursor-pointer active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h2 className="text-base sm:text-lg font-extrabold text-[#010508] tracking-tight">
              Doctor profile
            </h2>
            <div className="w-10" />
          </div>

          {/* Featured Profile Card (NO REAL PHOTOS — Vector Badge) */}
          <div className="bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[36px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-white/80 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Online Status Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </div>

                <p className="text-xs font-bold text-[#51575D]">
                  {selectedDoctor.title}
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#010508] tracking-tight mt-0.5">
                  {selectedDoctor.name}
                </h3>
                <p className="text-xs text-[#51575D] mt-1">
                  📍 {selectedDoctor.hospital}
                </p>

                {/* Price and Rating row */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-2xl font-black text-[#010508]">
                    ${selectedDoctor.rate}
                  </span>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <span>★</span>
                    <span>{selectedDoctor.rating}</span>
                  </div>
                  <span className="text-xs text-[#51575D]">/ hour</span>
                </div>

                {/* Message action button */}
                <div className="mt-4">
                  <button
                    aria-label="Direct message"
                    className="w-11 h-11 rounded-full bg-[#010508] text-white flex items-center justify-center hover:bg-[#191D1F] transition shadow-md cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <line x1="12" y1="8" x2="12" y2="14" />
                      <line x1="9" y1="11" x2="15" y2="11" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Doctor Vector Avatar Emblem (NO REAL PHOTOS) */}
              <DoctorVectorAvatar doctor={selectedDoctor} size="xl" />
            </div>
          </div>

          {/* Tab Navigation (About / Reviews / Availability) */}
          <div className="flex items-center justify-around border-b border-[#D1DBE0] pb-2 mb-5">
            {[
              { id: 'about', label: 'About' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'availability', label: 'Availability' },
            ].map((tab) => {
              const isActive = activeProfileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id as typeof activeProfileTab)}
                  className={`text-sm font-extrabold pb-2 relative transition cursor-pointer ${
                    isActive ? 'text-[#010508]' : 'text-[#51575D] hover:text-[#010508]'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#010508] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-5">
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/80 text-xs font-bold text-[#010508] shadow-sm whitespace-nowrap">
              <span>👥</span>
              <span>{selectedDoctor.patients} Patients</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/80 text-xs font-bold text-[#010508] shadow-sm whitespace-nowrap">
              <span>🎖️</span>
              <span>{selectedDoctor.experience}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3.5 py-2.5 rounded-full border border-white/80 text-xs font-bold text-[#010508] shadow-sm whitespace-nowrap">
              <span className="text-amber-400">★</span>
              <span>{selectedDoctor.rating} Rating</span>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-6 bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white/80">
            <h4 className="text-sm font-extrabold text-[#010508] mb-1.5">
              About
            </h4>
            <p className="text-xs sm:text-sm text-[#51575D] leading-relaxed">
              {selectedDoctor.about}
            </p>
          </div>

          {/* Available Time Section */}
          <div className="mb-7 bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white/80">
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-sm font-extrabold text-[#010508]">
                Available time
              </h4>
              <button className="flex items-center gap-1.5 bg-white border border-[#D1DBE0] text-xs font-bold text-[#010508] px-3.5 py-1.5 rounded-full shadow-sm">
                <span>Nov {selectedDate}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* Calendar Days Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
              {CALENDAR_DAYS.map((d) => {
                const isSelected = selectedDate === d.dayNum;
                return (
                  <button
                    key={d.dayNum}
                    onClick={() => setSelectedDate(d.dayNum)}
                    className={`flex flex-col items-center justify-center min-w-[50px] py-3 rounded-2xl transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#010508] text-white shadow-md'
                        : 'bg-white text-[#51575D] hover:bg-slate-50 border border-[#D1DBE0]'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#010508]'}`}>
                      {d.dayNum}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#51575D]'}`}>
                      {d.dayName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {TIME_SLOTS.slice(0, 3).map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 px-3 rounded-full text-xs font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#010508] text-white shadow-sm'
                        : 'bg-white text-[#51575D] hover:bg-slate-50 border border-[#D1DBE0]'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Book Appointment CTA Button */}
          <div className="pt-2">
            <button
              onClick={handleBookAppointment}
              className="w-full bg-[#010508] hover:bg-[#191D1F] active:scale-[0.99] text-white text-base font-extrabold py-4 px-6 rounded-full shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Book Appointment</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SCREEN C: BOOKING CONFIRMATION & CONSULTATION TYPE VIEW              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentScreen === 'C' && (
        <section aria-label="Book Appointment" className="max-w-3xl mx-auto px-4 sm:px-6 animate-in fade-in duration-300">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between mb-5 mt-1">
            <button
              onClick={() => setCurrentScreen('B')}
              aria-label="Back to profile"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-[#010508] flex items-center justify-center shadow-sm border border-[#D1DBE0] transition cursor-pointer active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h2 className="text-base sm:text-lg font-extrabold text-[#010508] tracking-tight">
              Book Appointment
            </h2>
            <div className="w-10" />
          </div>

          {/* Compact Reusable Doctor Summary Card (NO REAL PHOTOS) */}
          <div className="bg-white/90 backdrop-blur-md rounded-[32px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-white/80 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </div>
                <p className="text-xs font-semibold text-[#51575D]">
                  {selectedDoctor.title}
                </p>
                <h3 className="text-lg font-extrabold text-[#010508] tracking-tight">
                  {selectedDoctor.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-black text-[#010508]">
                    ${selectedDoctor.rate}
                  </span>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    <span>★</span>
                    <span>{selectedDoctor.rating}</span>
                  </div>
                </div>
              </div>

              <DoctorVectorAvatar doctor={selectedDoctor} size="md" />
            </div>
          </div>

          {/* Available Time Section */}
          <div className="mb-6 bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-[#010508]">
                Available time
              </h4>
              <button className="flex items-center gap-1 bg-white border border-[#D1DBE0] text-xs font-bold text-[#010508] px-3 py-1 rounded-full shadow-sm">
                <span>Nov {selectedDate}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* Calendar Days */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3.5">
              {CALENDAR_DAYS.map((d) => {
                const isSelected = selectedDate === d.dayNum;
                return (
                  <button
                    key={d.dayNum}
                    onClick={() => setSelectedDate(d.dayNum)}
                    className={`flex flex-col items-center justify-center min-w-[48px] py-2.5 rounded-2xl transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#010508] text-white shadow-md'
                        : 'bg-white text-[#51575D] hover:bg-slate-50 border border-[#D1DBE0]'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#010508]'}`}>
                      {d.dayNum}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#51575D]'}`}>
                      {d.dayName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 6 Time Slots in 3x2 Grid */}
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2.5 px-2 rounded-full text-xs font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#010508] text-white shadow-sm'
                        : 'bg-white text-[#51575D] hover:bg-slate-50 border border-[#D1DBE0]'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consultation Type Radio Selection */}
          <div className="mb-7">
            <h4 className="text-sm font-extrabold text-[#010508] mb-3">
              Consultation Type
            </h4>

            <div className="space-y-3">
              {/* Option 1: Video Call */}
              <div
                onClick={() => setConsultationType('video')}
                className={`p-4 rounded-3xl backdrop-blur-md transition cursor-pointer flex items-center justify-between border ${
                  consultationType === 'video'
                    ? 'bg-white border-[#010508] ring-2 ring-[#010508]/10 shadow-md'
                    : 'bg-white/80 border-white/90 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#E4E9EC] flex items-center justify-center text-[#010508]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-[#010508]">
                      Video call
                    </h5>
                    <p className="text-xs text-[#51575D]">
                      Video consultation with doctor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#010508]">$60</span>
                    <p className="text-[10px] text-[#51575D]">/30 mins</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      consultationType === 'video' ? 'border-[#010508]' : 'border-slate-300'
                    }`}
                  >
                    {consultationType === 'video' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#010508]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: In Person */}
              <div
                onClick={() => setConsultationType('in-person')}
                className={`p-4 rounded-3xl backdrop-blur-md transition cursor-pointer flex items-center justify-between border ${
                  consultationType === 'in-person'
                    ? 'bg-white border-[#010508] ring-2 ring-[#010508]/10 shadow-md'
                    : 'bg-white/80 border-white/90 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#E4E9EC] flex items-center justify-center text-[#010508]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-[#010508]">
                      In Person
                    </h5>
                    <p className="text-xs text-[#51575D]">
                      Visit hospital or clinic
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#010508]">$90</span>
                    <p className="text-[10px] text-[#51575D]">/45 mins</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      consultationType === 'in-person' ? 'border-[#010508]' : 'border-slate-300'
                    }`}
                  >
                    {consultationType === 'in-person' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#010508]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Booking Sticky Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirmBooking}
              className="w-full bg-[#010508] hover:bg-[#191D1F] active:scale-[0.99] text-white text-base font-extrabold py-4 px-6 rounded-full shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Confirm Booking</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FLOATING BOTTOM NAVIGATION DOCK                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Bottom Navigation Dock"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#010508]/95 backdrop-blur-md rounded-full px-4 py-3 shadow-2xl flex items-center gap-2.5 sm:gap-3.5 border border-white/10"
      >
        {/* Home Button */}
        <button
          onClick={() => {
            setCurrentScreen('A');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Home / Discovery"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        {/* Settings Button */}
        <button
          aria-label="Settings"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Pulse / Activity Button */}
        <button
          aria-label="Activity Pulse"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </button>

        {/* Active Pill: Doctors */}
        <button
          onClick={() => {
            setCurrentScreen('A');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-white text-[#010508] px-4 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition hover:bg-slate-100 cursor-pointer"
        >
          <StethoscopeIcon className="w-4 h-4 text-[#010508]" />
          <span>Doctors</span>
        </button>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BOOKING CONFIRMATION MODAL                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showBookingConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] max-w-sm w-full p-6 text-center shadow-2xl border border-white/80 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-[#010508] tracking-tight">
              Appointment Confirmed!
            </h3>
            <p className="text-xs text-[#51575D] mt-1">
              Your appointment with {selectedDoctor.name} has been placed.
            </p>

            <div className="bg-[#E4E9EC]/50 rounded-2xl p-3.5 my-4 text-left text-xs space-y-1.5 border border-[#E4E9EC]">
              <div className="flex justify-between">
                <span className="text-[#51575D]">Date:</span>
                <span className="font-bold text-[#010508]">Nov {selectedDate}, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#51575D]">Time:</span>
                <span className="font-bold text-[#010508]">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#51575D]">Type:</span>
                <span className="font-bold text-[#010508] capitalize">
                  {consultationType === 'video' ? 'Video call ($60)' : 'In Person ($90)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#51575D]">Location:</span>
                <span className="font-bold text-[#010508] truncate max-w-[170px]">
                  {selectedDoctor.hospital}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowBookingConfirmed(false);
                  setCurrentScreen('A');
                }}
                className="w-full bg-[#010508] hover:bg-[#191D1F] text-white py-3.5 rounded-full font-bold text-xs transition cursor-pointer shadow-md"
              >
                Back to Discovery
              </button>
              <a
                href="tel:+8801700000000"
                className="block w-full bg-[#E4E9EC]/70 hover:bg-[#E4E9EC] text-[#010508] py-2.5 rounded-full font-bold text-xs transition"
              >
                📞 Call Hospital Reception
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#D1DBE0] flex items-center justify-center font-bold">Loading...</div>}>
      <ModernMinimalistApp />
    </Suspense>
  );
}

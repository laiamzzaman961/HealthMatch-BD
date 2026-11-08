'use client';

import { BuildathonSticker } from './BuildathonSticker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    } else {
      setTheme('light');
      document.documentElement.dataset.theme = 'light';
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <nav className="sticky top-0 z-40 h-16 bg-white/85 backdrop-blur-md border-b border-[#D1DBE0] flex items-center justify-between px-3 sm:px-6 gap-2 transition-colors">
      {/* Left side — branding */}
      <Link
        href="/"
        className="flex items-center gap-2.5 min-w-0 overflow-hidden flex-shrink-1 text-decoration-none group"
      >
        <BuildathonSticker />

        {/* Minimalist Medical Cross & Magnifier Icon */}
        <div className="w-8 h-8 rounded-full bg-[#010508] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </div>

        <span className="font-extrabold text-base sm:text-lg text-[#010508] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] sm:max-w-[220px]">
          {t('HealthMatch BD', 'হেলথম্যাচ BD')}
        </span>
      </Link>

      {/* Navigation Links Pill Group */}
      <div className="hidden md:flex items-center gap-1 bg-[#E4E9EC]/70 p-1 rounded-full border border-[#D1DBE0]">
        <Link
          href="/"
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
            pathname === '/'
              ? 'bg-[#010508] text-white shadow-sm'
              : 'text-[#51575D] hover:text-[#010508]'
          }`}
        >
          {t('💬 Bengali Match Chat', '💬 বাংলা ম্যাচ চ্যাট')}
        </Link>
        <Link
          href="/form"
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
            pathname === '/form'
              ? 'bg-[#010508] text-white shadow-sm'
              : 'text-[#51575D] hover:text-[#010508]'
          }`}
        >
          {t('📋 Form Search', '📋 ফর্ম সার্চ')}
        </Link>
      </div>

      {/* Right side — Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Language selector */}
        <div
          role="group"
          aria-label="Language selector"
          className="flex border border-[#D1DBE0] rounded-full overflow-hidden bg-white/70 shadow-sm"
        >
          {(['en', 'bn'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`min-w-[40px] h-9 px-2.5 text-xs font-bold transition ${
                lang === l
                  ? 'bg-[#010508] text-white'
                  : 'bg-transparent text-[#51575D] hover:text-[#010508]'
              }`}
            >
              {l === 'en' ? 'EN' : 'বাংলা'}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="w-9 h-9 rounded-full border border-[#D1DBE0] bg-white/70 hover:bg-white text-sm flex items-center justify-center transition shadow-sm"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
}

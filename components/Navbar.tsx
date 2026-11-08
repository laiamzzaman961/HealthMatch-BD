'use client';

import { BuildathonSticker } from './BuildathonSticker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTab } from '@/contexts/TabContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { activeTab, setActiveTab } = useTab();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();
  const router = useRouter();

  // Sync theme state with document element on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark =
      stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const initialTheme = isDark ? 'dark' : 'light';
    setTheme(initialTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset.theme = 'light';
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset.theme = 'light';
    }
  };

  const handleTabChange = (tab: 'chat' | 'form') => {
    setActiveTab(tab);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/85 dark:bg-[#121820]/90 backdrop-blur-md border-b border-[#D1DBE0] dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 gap-2 transition-colors">
      {/* 1. Brand Logo */}
      <Link
        href="/"
        onClick={() => handleTabChange('chat')}
        className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden flex-shrink-1 no-underline group"
      >
        <BuildathonSticker />

        {/* Minimalist Medical Cross Icon */}
        <div className="w-8 h-8 rounded-full bg-[#010508] dark:bg-slate-100 text-white dark:text-[#010508] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </div>

        <span className="font-extrabold text-base sm:text-lg text-[#010508] dark:text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-[200px]">
          {t('HealthMatch BD', 'হেলথম্যাচ BD')}
        </span>
      </Link>

      {/* 2. Tab Switcher: "বাংলা ম্যাচ চ্যাট" vs "ফর্ম সার্চ" */}
      <div
        role="tablist"
        aria-label="View Switcher"
        className="flex items-center bg-[#E4E9EC] dark:bg-slate-800/80 p-1 rounded-full border border-white/60 dark:border-slate-700 shadow-sm"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => handleTabChange('chat')}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'chat'
              ? 'bg-[#010508] text-white shadow-sm'
              : 'text-[#51575D] dark:text-slate-300 hover:text-[#010508] dark:hover:text-white'
          }`}
        >
          {lang === 'bn' ? 'বাংলা ম্যাচ চ্যাট' : 'Bengali Match Chat'}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'form'}
          onClick={() => handleTabChange('form')}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'form'
              ? 'bg-[#010508] text-white shadow-sm'
              : 'text-[#51575D] dark:text-slate-300 hover:text-[#010508] dark:hover:text-white'
          }`}
        >
          {lang === 'bn' ? 'ফর্ম সার্চ' : 'Form Search'}
        </button>
      </div>

      {/* 3 & 4. Right Controls: Language & Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* 3. Language Selector */}
        <div
          role="group"
          aria-label="Language selector"
          className="flex border border-[#D1DBE0] dark:border-slate-700 rounded-full overflow-hidden bg-white/70 dark:bg-slate-800/70 shadow-sm"
        >
          {(['en', 'bn'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`min-w-[38px] sm:min-w-[42px] h-8 sm:h-9 px-2 text-xs font-bold transition cursor-pointer ${
                lang === l
                  ? 'bg-[#010508] text-white'
                  : 'bg-transparent text-[#51575D] dark:text-slate-300 hover:text-[#010508] dark:hover:text-white'
              }`}
            >
              {l === 'en' ? 'EN' : 'বাংলা'}
            </button>
          ))}
        </div>

        {/* 4. Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#D1DBE0] dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 text-sm flex items-center justify-center transition shadow-sm cursor-pointer"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

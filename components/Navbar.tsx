'use client';

import { BuildathonSticker } from './BuildathonSticker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 64,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.75rem',
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
        <BuildathonSticker />
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.125rem',
            color: 'var(--primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('HealthMatch BD', 'হেলথম্যাচ BD')}
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Language segmented control */}
        <div
          role="group"
          aria-label="Language selector"
          style={{
            display: 'flex',
            border: '1px solid var(--border)',
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          {(['en', 'bn'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                minWidth: 48,
                minHeight: 48,
                padding: '0 0.75rem',
                background: lang === l ? 'var(--primary)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: lang === l ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {l === 'en' ? 'EN' : 'বাংলা'}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            minWidth: 48,
            minHeight: 48,
            border: '1px solid var(--border)',
            borderRadius: 9999,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
}

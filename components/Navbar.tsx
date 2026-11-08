'use client';

import { BuildathonSticker } from './BuildathonSticker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
        justifyContent: 'space-between',
        padding: '0 0.75rem',
        gap: '0.5rem',
      }}
    >
      {/* Left side — branding group */}
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: 0,
          overflow: 'hidden',
          flexShrink: 1,
          textDecoration: 'none',
        }}
      >
        <BuildathonSticker />

        {/* Health + search SVG icon */}
        <svg
          aria-hidden="true"
          width={20}
          height={20}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0, color: 'var(--primary)' }}
        >
          {/* Cross / plus mark */}
          <rect x={8} y={2} width={4} height={10} rx={1.5} fill="currentColor" opacity={0.85} />
          <rect x={4} y={6} width={12} height={4} rx={1.5} fill="currentColor" opacity={0.85} />
          {/* Magnifier circle + handle */}
          <circle
            cx={11}
            cy={11}
            r={6}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
          />
          <line
            x1={15.5}
            y1={15.5}
            x2={18.5}
            y2={18.5}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>

        {/* App title — hidden on very small screens to avoid overflow */}
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.0625rem',
            color: 'var(--primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            // Clamp to prevent overflow on tiny screens; JS-free responsive trick
            maxWidth: 'clamp(0px, 30vw, 220px)',
          }}
        >
          {t('HealthMatch BD', 'হেলথম্যাচ BD')}
        </span>
      </Link>

      {/* Right side — controls, never shrink */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
        {/* Doctor Discovery Link */}
        <Link
          href="/discovery"
          title="Modern Doctor Discovery"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0 0.625rem',
            height: 38,
            borderRadius: 9999,
            background: 'var(--tint)',
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid var(--border)',
            textDecoration: 'none',
          }}
        >
          <span>🩺</span>
          <span style={{ whiteSpace: 'nowrap' }}>Discovery</span>
        </Link>

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
                minWidth: 44,
                minHeight: 44,
                padding: '0 0.625rem',
                background: lang === l ? 'var(--primary)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: lang === l ? 600 : 400,
                fontSize: '0.8125rem',
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
            minWidth: 44,
            minHeight: 44,
            border: '1px solid var(--border)',
            borderRadius: 9999,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '1.125rem',
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

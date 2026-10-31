import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
      <h1 style={{ fontWeight: 700, fontSize: '2rem', color: 'var(--primary)', marginBottom: '1rem' }}>
        HealthMatch BD
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Find doctors and diagnostic centres near you in Bangladesh.
      </p>
      <Link
        href="/form"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 48,
          padding: '0 2rem',
          borderRadius: 9999,
          background: 'var(--primary)',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1rem',
        }}
      >
        Find a Doctor →
      </Link>
    </div>
  );
}

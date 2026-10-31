'use client';

import { useState } from 'react';

export function BuildathonSticker() {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div
        title="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
        aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
        style={{
          width: 48,
          height: 48,
          border: '2px dashed var(--primary)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          textAlign: 'center',
          background: 'var(--tint)',
          flexShrink: 0,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1.1, color: 'var(--primary)' }}>
          AIgnite
        </span>
        <span style={{ fontSize: '7px', color: 'var(--text-secondary)', lineHeight: 1 }}>
          2026
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/buildathon-sticker.png"
      alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
      title="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
      width={48}
      height={48}
      style={{ borderRadius: 8, flexShrink: 0, objectFit: 'contain' }}
      onError={() => setImgFailed(true)}
    />
  );
}

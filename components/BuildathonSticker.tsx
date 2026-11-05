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
          height: 36,
          padding: '0 8px',
          border: '2px dashed var(--primary)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--tint)',
          flexShrink: 0,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)' }}>
          AIgnite 2026
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
      style={{
        height: '36px',
        width: 'auto',
        maxHeight: '40px',
        borderRadius: 6,
        flexShrink: 0,
        objectFit: 'contain',
      }}
      onError={() => setImgFailed(true)}
    />
  );
}
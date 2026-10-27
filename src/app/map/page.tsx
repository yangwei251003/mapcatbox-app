'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('@/components/map/MapClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFFBF5',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, animation: 'cat-bounce 0.6s infinite' }}>🐱</div>
        <p style={{ fontSize: 14, color: '#8B7D72', marginTop: 12 }}>地图加载中...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return <MapClient />;
}

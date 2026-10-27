'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useMapStore } from '@/stores/map-store';
import { useAuthStore } from '@/stores/auth-store';
import type { StrayCat } from '@/types';
import Link from 'next/link';
import { cloudEnabled, deviceLocationEnabled, assetPath } from '@/lib/runtime-config';

// ---- Leaflet dynamic import (no SSR) ----
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const ImageOverlay = dynamic(() => import('react-leaflet').then(m=>m.ImageOverlay), {ssr:false});
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);
const MapViewport = dynamic(() => import('./MapViewport'), {ssr:false});

// ---- Lazy load leaflet CSS ----
function useLeafletCSS() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
    }
  }, []);
}

const DEFAULT_CENTER: [number, number] = [0, 0];
const DEFAULT_ZOOM = 2;

const RARITY_COLORS: Record<string, string> = {
  common: '#84CC94',
  uncommon: '#60A5FA',
  rare: '#A78BFA',
  legendary: '#FBBF24',
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '罕见',
  rare: '稀有',
  legendary: '传说',
};

// ---- Stray Cat Marker with popup ----
function StrayMarker({ cat, onAdopt }: { cat: StrayCat; onAdopt: () => void }) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => setL(leaflet));
  }, []);

  if (!L) return null;

  const color = RARITY_COLORS[cat.rarity] || RARITY_COLORS.common;
  const isLegendary = cat.rarity === 'legendary';

  const icon = L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color}22;border:2px solid ${color};
      display:flex;align-items:center;justify-content:center;
      font-size:18px;cursor:pointer;
      ${isLegendary ? 'animation: cat-bounce 0.6s ease-in-out infinite; box-shadow: 0 0 12px ' + color + ';' : ''}
    ">?</div>`,
  });

  return (
    <>
      <Marker position={[cat.latitude, cat.longitude]} icon={icon}>
        <Popup>
          <div style={{ fontFamily: 'var(--font-geist), sans-serif', minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 12, padding: '2px 8px', borderRadius: 999,
                background: `${color}22`, color, fontWeight: 600,
              }}>
                {RARITY_LABELS[cat.rarity]}
              </span>
              <span style={{ fontSize: 13, color: '#8B7D72' }}>{cat.breed}</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#3D322B', margin: '0 0 4px' }}>
              {cat.name}
            </p>
            <p style={{ fontSize: 12, color: '#8B7D72', margin: '0 0 10px', lineHeight: 1.5 }}>
              {cat.story || '一只神秘的流浪猫...'}
            </p>
            <button
              onClick={onAdopt}
              style={{
                width: '100%', padding: '8px', borderRadius: 12,
                background: '#F59E6B', color: '#fff', border: 'none',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}
            >
              领养 {cat.name}
            </button>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

// ---- Bottom Sheet ----
function BottomSheet({ strayCats }: { strayCats: StrayCat[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (strayCats.length === 0) {
    return (
      <div style={{
        position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 500,
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '16px 20px',
          boxShadow: '0 2px 16px rgba(61,50,43,0.08)',
          border: '1px solid #F0E8DF',
        }}>
          <p style={{ fontSize: 13, color: '#8B7D72', textAlign: 'center', margin: 0 }}>
            🌍 附近暂未发现流浪猫，出门走走可能会有新发现哦
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 500,
      maxHeight: isOpen ? '50vh' : 'auto', overflow: isOpen ? 'auto' : 'hidden',
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#fff', borderRadius: 20, padding: '12px 20px',
          boxShadow: '0 2px 16px rgba(61,50,43,0.08)',
          border: '1px solid #F0E8DF', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 32, height: 4, borderRadius: 999,
          background: '#E0D8D0', margin: '0 auto 10px',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#3D322B' }}>
            🐱 附近发现 {strayCats.length} 只流浪猫
          </span>
          <span style={{ fontSize: 12, color: '#C4B8AF' }}>
            {isOpen ? '收起' : '展开'} ▾
          </span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '8px 0' }}>
          {strayCats.map((cat) => (
            <div key={cat.id} style={{
              background: '#fff', borderRadius: 16, padding: 12,
              marginBottom: 8, border: '1px solid #F0E8DF',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${RARITY_COLORS[cat.rarity]}15`,
                border: `2px solid ${RARITY_COLORS[cat.rarity]}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🐱
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3D322B' }}>{cat.name}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 999,
                    background: `${RARITY_COLORS[cat.rarity]}22`,
                    color: RARITY_COLORS[cat.rarity], fontWeight: 500,
                  }}>
                    {RARITY_LABELS[cat.rarity]}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#8B7D72', margin: 0 }}>
                  {cat.breed} · {cat.city}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Guest Overlay ----
function GuestOverlay() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{
      position: 'absolute', top: 56, left: 16, right: 16, zIndex: 600,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 20,
        boxShadow: '0 4px 24px rgba(61,50,43,0.12)',
        border: '1px solid #F0E8DF', textAlign: 'center',
        fontFamily: 'var(--font-geist), system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🐱</div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#3D322B', margin: '0 0 4px' }}>
          欢迎来到地图猫箱
        </h2>
        <p style={{ fontSize: 13, color: '#8B7D72', margin: '0 0 12px', lineHeight: 1.6 }}>
          在地图上探索附近的流浪猫，注册领养你的第一只猫咪吧！
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/auth" style={{
            flex: 1, padding: '10px', borderRadius: 12,
            background: '#F59E6B', color: '#fff', border: 'none',
            fontSize: 13, cursor: 'pointer', fontWeight: 600,
            textDecoration: 'none', textAlign: 'center',
          }}>
            注册 / 登录
          </Link>
          <button
            onClick={() => setDismissed(true)}
            style={{
              padding: '10px 16px', borderRadius: 12,
              background: '#fff', color: '#8B7D72', border: '1px solid #F0E8DF',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            先逛逛
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Map Component ----
function MapInner() {
  const { userLocation, nearbyStrayCats, startLocationTracking, stopLocationTracking, _watchId, fetchNearbyStrayCats } = useMapStore();
  const { user, isGuest, updateProfile } = useAuthStore();
  const mapReady = true;
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useLeafletCSS();

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      // Fix default icon
      delete (leaflet.Icon.Default.prototype as unknown as {_getIconUrl?: unknown})._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: assetPath('cat-icon.svg'),
        iconUrl: assetPath('cat-icon.svg'),
        shadowUrl: assetPath('cat-icon.svg'),
      });
      setL(leaflet);
    });
  }, []);

  // A page visit never asks for device location or starts a remote location writer.
  useEffect(() => {
    if (!cloudEnabled) {useMapStore.getState().setUserLocation({lat:0,lng:0});void fetchNearbyStrayCats(0,0);}
    return ()=>{void stopLocationTracking().catch(()=>console.warn('停止共享失败，请检查自己的云端记录。'));};
  }, [fetchNearbyStrayCats,stopLocationTracking]);

  const toggleSharing=async()=>{
    if(!deviceLocationEnabled||!user)return;
    if(_watchId!==null){await stopLocationTracking();return;}
    if(!window.confirm('开启后将请求本机位置并上传到你配置的云数据库，供已接受好友读取；离开地图或点击停止会尝试删除位置记录。是否继续？'))return;
    await updateProfile({visibility:'friends_only'});
    startLocationTracking(user.id);
  };

  // User marker icon
  const userIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      html: `<div style="
        width:32px;height:32px;border-radius:50%;
        background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 4px #3B82F633;
        display:flex;align-items:center;justify-content:center;
        animation: cat-bounce 2s ease-in-out infinite;
        font-size:18px;
      ">🐱</div>`,
    });
  }, [L]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 152px)' }}>
      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#FFFBF5',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, animation: 'cat-bounce 0.6s infinite' }}>🐱</div>
            <p style={{ fontSize: 14, color: '#8B7D72', marginTop: 12 }}>地图加载中...</p>
          </div>
        </div>
      )}

      {mapReady && L && (
        <>
          <MapContainer
            center={[userLocation?.lat ?? DEFAULT_CENTER[0], userLocation?.lng ?? DEFAULT_CENTER[1]]}
            crs={cloudEnabled ? L.CRS.EPSG3857 : L.CRS.Simple}
            zoom={DEFAULT_ZOOM}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            {cloudEnabled && userLocation && <MapViewport position={userLocation} />}
            {cloudEnabled ? <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            /> : <ImageOverlay url={assetPath('maps/synthetic-grid.svg')} bounds={[[-50,-50],[50,50]]} />}

            {/* User location marker */}
            {userLocation && userIcon && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
            )}

            {/* Stray cat markers */}
            {nearbyStrayCats.map((cat) => (
              <StrayMarker key={cat.id} cat={cat} onAdopt={() => {
                alert('领养接口与页面尚未完成；当前合成演示不连接注册或云端。');
              }} />
            ))}
          </MapContainer>

          {/* Overlays */}
          {isGuest && cloudEnabled && <GuestOverlay />}
          {deviceLocationEnabled && user && <button onClick={()=>void toggleSharing().catch(()=>alert('位置操作失败，请检查个人云配置；不要继续共享。'))} style={{position:'absolute',top:16,right:16,zIndex:700,padding:12,background:'white',borderRadius:12}}>{_watchId===null?'明确开启位置共享':'停止共享并删除位置'}</button>}
          <BottomSheet strayCats={nearbyStrayCats} />
        </>
      )}
    </div>
  );
}

export default function MapClient() {
  return <MapInner />;
}

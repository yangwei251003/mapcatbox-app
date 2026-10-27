'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {useRouter} from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Cookie,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCatStore } from '@/stores/cat-store';
import type { Cat } from '@/types';

// ============================================================
// Constants
// ============================================================

const FEED_COOLDOWN_MS = 2000;
const PLAY_COOLDOWN_MS = 2000;
const ANIMATION_DURATION = 1500;
const AWAY_DURATION_HOURS = 24;
const MAX_HEARTS = 8;

const CAT_COLOR_MAP: Record<string, { primary: string; secondary: string; eyeColor: string; nose: string }> = {
  orange: { primary: '#F59E6B', secondary: '#FDEBD7', eyeColor: '#FFD700', nose: '#F38D4E' },
  black: { primary: '#3D322B', secondary: '#6B5D55', eyeColor: '#FFD700', nose: '#4A4038' },
  white: { primary: '#FEFEFE', secondary: '#F0E8DF', eyeColor: '#5B9BD5', nose: '#F0A8B8' },
  grey: { primary: '#C4B8AF', secondary: '#F5F0EB', eyeColor: '#7CB342', nose: '#D4C4A8' },
  seal: { primary: '#8B7355', secondary: '#F5E6D3', eyeColor: '#5B9BD5', nose: '#6B5335' },
  blue: { primary: '#9CA3AF', secondary: '#E5E7EB', eyeColor: '#5B9BD5', nose: '#6B7280' },
  chocolate: { primary: '#8B4513', secondary: '#DEB887', eyeColor: '#FFD700', nose: '#6B3310' },
  cream: { primary: '#F5E6D3', secondary: '#FDEBD7', eyeColor: '#FFD700', nose: '#E8D5C8' },
  silver: { primary: '#D4D4D8', secondary: '#E4E4E7', eyeColor: '#7CB342', nose: '#A1A1AA' },
  silver_tabby: { primary: '#A8A29E', secondary: '#F5F0EB', eyeColor: '#7CB342', nose: '#78716C' },
  brown_tabby: { primary: '#8B7355', secondary: '#DEB887', eyeColor: '#FFD700', nose: '#6B5335' },
  calico_classic: { primary: '#FEFEFE', secondary: '#F59E6B', eyeColor: '#FFD700', nose: '#F0A8B8' },
  dilute_calico: { primary: '#F5F0EB', secondary: '#D4C4A8', eyeColor: '#5B9BD5', nose: '#E8D5C8' },
  blue_point: { primary: '#E8E0D8', secondary: '#9CA3AF', eyeColor: '#5B9BD5', nose: '#6B7280' },
  seal_point: { primary: '#F5E6D3', secondary: '#8B7355', eyeColor: '#5B9BD5', nose: '#6B5335' },
};

const RARITY_GRADIENTS: Record<string, { glow: string; badge: string }> = {
  common: { glow: 'rgba(132, 204, 148, 0.3)', badge: '#84CC94' },
  uncommon: { glow: 'rgba(96, 165, 250, 0.3)', badge: '#60A5FA' },
  rare: { glow: 'rgba(167, 139, 250, 0.35)', badge: '#A78BFA' },
  legendary: { glow: 'rgba(251, 191, 36, 0.4)', badge: '#FBBF24' },
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '罕见',
  rare: '稀有',
  legendary: '传说',
};

function getColorOrDefault(color: string) {
  return CAT_COLOR_MAP[color] ?? { primary: '#F59E6B', secondary: '#FDEBD7', eyeColor: '#FFD700', nose: '#F38D4E' };
}

// ============================================================
// Helpers
// ============================================================

function formatAwayTime(awaySince: string | null): string {
  if (!awaySince) return '';
  try {
    const away = new Date(awaySince).getTime();
    const returnAt = away + AWAY_DURATION_HOURS * 60 * 60 * 1000;
    const now = Date.now();
    if (now >= returnAt) return '即将回来';
    const diff = returnAt - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${mins}分钟`;
    return `${mins}分钟`;
  } catch {
    return '';
  }
}

function formatPercent(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// ============================================================
// Sub-components
// ============================================================

/* ---- Cat SVG illustration ---- */
function CatSvg({ cat, className = '' }: { cat: Cat; className?: string }) {
  const colors = useMemo(() => getColorOrDefault(cat.color), [cat.color]);
  const isCalico = cat.color === 'calico_classic' || cat.color === 'dilute_calico';

  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      style={{ overflow: 'visible' }}
      aria-label={`${cat.name}的插画`}
    >
      {/* Tail */}
      <g transform="translate(135, 155)">
        <path
          d="M 0,0 Q 30,-15 45,-40 Q 50,-50 40,-52 Q 25,-48 25,-30 Q 25,-10 0,0 Z"
          fill={colors.primary}
          stroke={colors.primary}
          strokeWidth="1"
        />
        {!isCalico && (
          <path
            d="M 30,-42 Q 35,-50 40,-52"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="4"
            strokeLinecap="round"
            opacity={0.6}
          />
        )}
      </g>

      {/* Body */}
      <ellipse cx="100" cy="165" rx="42" ry="38" fill={colors.primary} />

      {/* Body stripe / secondary color patch */}
      {!isCalico && cat.color !== 'white' && (
        <ellipse cx="100" cy="170" rx="30" ry="20" fill={colors.secondary} opacity={0.5} />
      )}
      {isCalico && (
        <>
          <ellipse cx="100" cy="160" rx="18" ry="14" fill={colors.secondary} opacity={0.7} />
          <ellipse cx="118" cy="175" rx="12" ry="10" fill={colors.primary} opacity={0.8} />
        </>
      )}

      {/* Front paws */}
      <ellipse cx="80" cy="198" rx="14" ry="9" fill={colors.primary} />
      <ellipse cx="120" cy="198" rx="14" ry="9" fill={colors.primary} />
      {/* Paw pads */}
      <ellipse cx="80" cy="200" rx="7" ry="5" fill={colors.secondary} opacity={0.7} />
      <ellipse cx="120" cy="200" rx="7" ry="5" fill={colors.secondary} opacity={0.7} />

      {/* Head */}
      <circle cx="100" cy="92" r="38" fill={colors.primary} />

      {/* Head pattern */}
      {!isCalico && cat.color !== 'white' && (
        <path
          d="M 100,58 Q 105,75 100,92 Q 95,75 100,58"
          fill={colors.secondary}
          opacity={0.4}
        />
      )}
      {isCalico && (
        <>
          <path
            d="M 70,80 Q 80,70 85,90 Q 75,100 70,80"
            fill={colors.secondary}
            opacity={0.6}
          />
          <path
            d="M 110,75 Q 120,65 128,80 Q 120,95 110,75"
            fill={colors.nose}
            opacity={0.4}
          />
        </>
      )}

      {/* Left ear */}
      <polygon points="68,65 50,20 88,58" fill={colors.primary} stroke={colors.primary} strokeWidth="1" />
      <polygon points="68,62 54,28 82,58" fill={colors.nose} opacity={0.5} />

      {/* Right ear */}
      <polygon points="132,65 150,20 112,58" fill={colors.primary} stroke={colors.primary} strokeWidth="1" />
      <polygon points="132,62 146,28 118,58" fill={colors.nose} opacity={0.5} />

      {/* Left eye - white */}
      <ellipse cx="83" cy="87" rx="11" ry="12" fill="white" />
      {/* Left pupil */}
      <ellipse cx="84" cy="89" rx="6" ry="7" fill={colors.eyeColor} />
      {/* Left eye shine 1 */}
      <circle cx="81" cy="85" r="3" fill="white" />
      {/* Left eye shine 2 */}
      <circle cx="87" cy="87" r="1.5" fill="white" />

      {/* Right eye - white */}
      <ellipse cx="117" cy="87" rx="11" ry="12" fill="white" />
      {/* Right pupil */}
      <ellipse cx="116" cy="89" rx="6" ry="7" fill={colors.eyeColor} />
      {/* Right eye shine 1 */}
      <circle cx="114" cy="85" r="3" fill="white" />
      {/* Right eye shine 2 */}
      <circle cx="119" cy="87" r="1.5" fill="white" />

      {/* Blush cheeks */}
      <ellipse cx="70" cy="100" rx="6" ry="3" fill="#F0A8B8" opacity={0.35} />
      <ellipse cx="130" cy="100" rx="6" ry="3" fill="#F0A8B8" opacity={0.35} />

      {/* Nose */}
      <polygon points="100,100 97,103 103,103" fill={colors.nose} />

      {/* Mouth (W shape) */}
      <path
        d="M 97,103 Q 98,106 100,104 Q 101,106 103,103"
        fill="none"
        stroke="#6B5D55"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Whiskers - left */}
      <line x1="68" y1="98" x2="38" y2="93" stroke="#C4B8AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="68" y1="101" x2="36" y2="101" stroke="#C4B8AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="68" y1="104" x2="38" y2="110" stroke="#C4B8AF" strokeWidth="1" strokeLinecap="round" />

      {/* Whiskers - right */}
      <line x1="132" y1="98" x2="162" y2="93" stroke="#C4B8AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="132" y1="101" x2="164" y2="101" stroke="#C4B8AF" strokeWidth="1" strokeLinecap="round" />
      <line x1="132" y1="104" x2="162" y2="110" stroke="#C4B8AF" strokeWidth="1" strokeLinecap="round" />

      {/* Small accessory dot (if level >= 5) */}
      {cat.level >= 5 && (
        <circle cx="138" cy="80" r="4" fill="#FBBF24" opacity={0.8}>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

/* ---- Mini cat thumbnail for selector ---- */
function CatMiniSvg({ cat }: { cat: Cat }) {
  const colors = useMemo(() => getColorOrDefault(cat.color), [cat.color]);
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" aria-label={cat.name}>
      {/* Simplified cat icon for small thumbnails */}
      <circle cx="30" cy="22" r="14" fill={colors.primary} />
      {/* Ears */}
      <polygon points="20,12 16,0 26,8" fill={colors.primary} />
      <polygon points="40,12 44,0 34,8" fill={colors.primary} />
      {/* Inner ears */}
      <polygon points="20,10 17.5,4 25,8" fill={colors.nose} opacity={0.5} />
      <polygon points="40,10 42.5,4 35,8" fill={colors.nose} opacity={0.5} />
      {/* Eyes */}
      <circle cx="25" cy="20" r="3.5" fill="white" />
      <circle cx="35" cy="20" r="3.5" fill="white" />
      <circle cx="25.5" cy="21" r="2" fill={colors.eyeColor} />
      <circle cx="35.5" cy="21" r="2" fill={colors.eyeColor} />
      {/* Eye shines */}
      <circle cx="23.5" cy="18.5" r="1.2" fill="white" />
      <circle cx="33.5" cy="18.5" r="1.2" fill="white" />
      {/* Nose */}
      <polygon points="30,25 28.5,26.5 31.5,26.5" fill={colors.nose} />
      {/* Body */}
      <ellipse cx="30" cy="46" rx="12" ry="9" fill={colors.primary} />
      {/* Blush */}
      <ellipse cx="20" cy="25" rx="3" ry="1.5" fill="#F0A8B8" opacity={0.3} />
      <ellipse cx="40" cy="25" rx="3" ry="1.5" fill="#F0A8B8" opacity={0.3} />
    </svg>
  );
}

/* ---- Status bar component ---- */
function StatusBar({
  label,
  emoji,
  value,
  color,
}: {
  label: string;
  emoji: string;
  value: number;
  color: string;
}) {
  const clamped = clamp(value);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm shrink-0 w-5 text-center leading-none" role="img" aria-label={label}>
        {emoji}
      </span>
      <span className="text-xs font-medium text-[var(--color-text-sub)] w-10 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2.5 bg-[var(--color-border)] rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
      <span className="text-[11px] font-medium text-[var(--color-text-sub)] w-9 text-right shrink-0 tabular-nums">
        {formatPercent(clamped)}
      </span>
    </div>
  );
}

/* ---- Flying heart ---- */
function FlyingHeart({ id, x, y }: { id: number; x: number; y: number }) {
  return (
    <motion.div
      key={id}
      className="absolute pointer-events-none z-30"
      initial={{ opacity: 1, scale: 0.5, x, y }}
      animate={{
        opacity: 0,
        scale: 1,
        y: y - 80 - (id % 41),
        x: x + ((id % 61) - 30),
      }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <Heart
        size={14 + (id % 11)}
        fill="#F0A8B8"
        stroke="none"
      />
    </motion.div>
  );
}

// ============================================================
// Skeleton loader
// ============================================================

function SkeletonLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 pt-24 pb-32">
      {/* Cat skeleton */}
      <div className="skeleton w-40 h-40 rounded-full mb-8" />

      {/* Status bar skeletons */}
      <div className="w-full max-w-xs space-y-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="skeleton w-5 h-5 rounded" />
            <div className="skeleton w-8 h-3 rounded" />
            <div className="flex-1 skeleton h-2 rounded-full" />
            <div className="skeleton w-8 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Button skeletons */}
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton w-20 h-11 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export default function CatboxPage() {
  const router=useRouter();
  // ---- Store ----
  const {
    cats,
    isGuest,
    isLoading: authLoading,
    fetchCats,
    user,
  } = useAuthStore();

  const {
    selectedCat,
    setSelectedCat,
    feed,
    play,
    pet,
    loading: catActionLoading,
  } = useCatStore();

  // ---- Local state ----
  const [interactionState, setInteractionState] = useState<'idle' | 'feeding' | 'playing' | 'purring'>('idle');
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [toyPos, setToyPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectorScroll, setSelectorScroll] = useState(0);
  const [pageReady, setPageReady] = useState(false);

  const catDisplayRef = useRef<HTMLDivElement>(null);
  const heartCounter = useRef(0);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Derived state ----
  const nonAwayCats = useMemo(() => cats.filter((c) => !c.is_away), [cats]);

  // ---- Auto-select first non-away cat ----
  useEffect(() => {
    if (cats.length > 0 && !selectedCat) {
      const first = nonAwayCats[0] ?? cats[0];
      setSelectedCat(first);
    }
    // If selected cat is away but there are non-away cats, switch
    if (selectedCat?.is_away && nonAwayCats.length > 0) {
      setSelectedCat(nonAwayCats[0]);
    }
  }, [cats, selectedCat, nonAwayCats, setSelectedCat]);

  // ---- Fetch cats if needed ----
  useEffect(() => {
    if (user && !isGuest && cats.length === 0 && !authLoading) {
      fetchCats();
    }
    // Mark page ready after short delay for data
    const timer = setTimeout(() => setPageReady(true), 300);
    return () => clearTimeout(timer);
  }, [user, cats.length, authLoading, isGuest, fetchCats]);

  // ---- Cleanup animation timers ----
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  // ---- Heart spawner for pet effect ----
  const spawnHearts = useCallback(() => {
    if (!catDisplayRef.current) return;
    const rect = catDisplayRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const newHearts = Array.from({ length: MAX_HEARTS }, () => {
      heartCounter.current += 1;
      return {
        id: heartCounter.current,
        x: cx + (Math.random() - 0.5) * 120,
        y: cy + (Math.random() - 0.5) * 80,
      };
    });

    setHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setHearts((prev) =>
        prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)),
      );
    }, 1500);
  }, []);

  // ---- Action handler ----
  const handleAction = useCallback(
    async (action: 'feed' | 'play' | 'pet') => {
      if (!selectedCat) return;

      // Cooldown check
      if ((action === 'feed' || action === 'play') && cooldowns[action]) return;

      if (action === 'feed' || action === 'play') {
        setCooldowns((prev) => ({ ...prev, [action]: true }));
        const duration = action === 'feed' ? FEED_COOLDOWN_MS : PLAY_COOLDOWN_MS;
        setTimeout(() => {
          setCooldowns((prev) => ({ ...prev, [action]: false }));
        }, duration);
      }

      // Clear any existing animation timeout
      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }

      try {
        if (action === 'feed') {
          setInteractionState('feeding');
          await feed(selectedCat.id);
          animTimeoutRef.current = setTimeout(() => setInteractionState('idle'), ANIMATION_DURATION);
        } else if (action === 'play') {
          setInteractionState('playing');
          // Animate toy
          const toyIntervals = [
            { x: -30, y: -20 },
            { x: 20, y: -40 },
            { x: -15, y: -10 },
            { x: 25, y: -30 },
          ];
          let i = 0;
          setToyPos(toyIntervals[0]);
          const interval = setInterval(() => {
            i += 1;
            if (i < toyIntervals.length) setToyPos(toyIntervals[i]);
            else {
              setToyPos({ x: 0, y: 0 });
              clearInterval(interval);
            }
          }, 350);
          await play(selectedCat.id);
          animTimeoutRef.current = setTimeout(() => {
            setInteractionState('idle');
            setToyPos({ x: 0, y: 0 });
            clearInterval(interval);
          }, ANIMATION_DURATION + 500);
        } else if (action === 'pet') {
          setInteractionState('purring');
          spawnHearts();
          await pet(selectedCat.id);
          animTimeoutRef.current = setTimeout(() => setInteractionState('idle'), ANIMATION_DURATION);
        }
      } catch {
        setInteractionState('idle');
      }
    },
    [selectedCat, cooldowns, feed, play, pet, spawnHearts],
  );

  // ---- Cat selector scroll ----
  const handleScroll = useCallback((dir: 'left' | 'right') => {
    setSelectorScroll((prev) => {
      const next = dir === 'left' ? prev - 100 : prev + 100;
      return Math.max(0, Math.min(next, cats.length * 80 - 200));
    });
  }, [cats.length]);

  // ---- Render states ----

  // 1. Loading
  if (authLoading || (!pageReady && user)) {
    return <SkeletonLoader />;
  }

  // 2. Guest
  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 pt-16 pb-32 bg-[var(--color-bg)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="text-center max-w-xs"
        >
          <div className="text-7xl mb-6">🐱</div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
            猫箱小屋
          </h2>
          <p className="text-sm text-[var(--color-text-sub)] mb-2 leading-relaxed">
            一个温暖的小窝，等你来照顾你的猫咪
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mb-8">
            注册领养你的第一只猫咪，开始你的猫箱之旅
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium text-sm shadow-lg shadow-[var(--color-primary)]/25"
          >
            <UserPlus size={18} />
            注册成为猫友
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // 3. Empty (no cats)
  if (user && cats.length === 0 && pageReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 pt-16 pb-32 bg-[var(--color-bg)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="text-center max-w-xs"
        >
          <div className="text-6xl mb-5 opacity-50">🐾</div>
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
            你还没有猫咪
          </h2>
          <p className="text-sm text-[var(--color-text-sub)] mb-6 leading-relaxed">
            去地图上探索，发现流浪猫咪并领养它们吧
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Navigate to map page
              router.push('/map');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-medium text-sm"
          >
            <Sparkles size={16} />
            去发现猫咪
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // 4. Away cat
  if (!selectedCat && cats.length > 0 && nonAwayCats.length === 0) {
    // All cats are away
    const firstCat = cats[0];
    const aTime = formatAwayTime(firstCat.away_since);
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 pt-16 pb-32 bg-[var(--color-bg)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-xs"
        >
          <motion.div
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-7xl mb-5"
          >
            😿
          </motion.div>
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
            猫咪离家出走了
          </h2>
          {firstCat && (
            <p className="text-sm text-[var(--color-text-sub)] mb-1">
              {firstCat.name} 暂时离开了...
            </p>
          )}
          {aTime && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-[var(--color-border)]/60 rounded-xl">
              <Clock size={14} className="text-[var(--color-text-sub)]" />
              <span className="text-sm text-[var(--color-text-sub)] font-medium">
                预计 {aTime} 后回来
              </span>
            </div>
          )}
          <p className="text-xs text-[var(--color-text-muted)] mt-6">
            多和猫咪互动可以防止它离家出走哦
          </p>
        </motion.div>
      </div>
    );
  }

  // 5. If no cat is selected but non-away cats exist (shouldn't happen, but guard)
  if (!selectedCat) {
    return <SkeletonLoader />;
  }

  // ---- Normal interactive view ----
  const rarityGlow = RARITY_GRADIENTS[selectedCat.rarity] ?? RARITY_GRADIENTS.common;

  // Build animation variants based on interaction state
  const catAnimationVariants = {
    idle: {
      y: [0, -5, 0],
      transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' as const },
    },
    feeding: {
      y: [0, 8, 0],
      scale: [1, 0.97, 1],
      transition: { duration: 0.8, ease: 'easeInOut' as const },
    },
    playing: {
      scale: [1, 1.05, 1, 1.04, 1],
      rotate: [0, -2, 2, -1, 0],
      transition: { duration: 0.5, ease: 'easeInOut' as const },
    },
    purring: {
      rotate: [0, -1, 1, -0.5, 0.5, 0],
      scale: [1, 1.02, 1, 1.02, 1, 1],
      transition: { duration: 0.3, repeat: 3, ease: 'easeInOut' as const },
    },
  };

  return (
    <div className="relative min-h-[calc(100dvh-152px)] overflow-hidden bg-[#FFFBF5]">
      {/* ===== Room Scene Background ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {/* Wall */}
        <div className="absolute inset-0 h-[55%] bg-gradient-to-b from-[#FFFBF5] via-[#FFF9F2] to-[#F5F0EB]" />

        {/* Window frame */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-36 h-28 rounded-t-[40%] border-[5px] border-[#D4C4A8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden bg-white">
          {/* Window panes */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 bottom-0 w-[3px] bg-[#D4C4A8]" />
            <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-[#D4C4A8]" />
          </div>
          {/* Sky */}
          <div className="w-full h-full bg-gradient-to-b from-[#87CEEB] via-[#B8E0F7] to-[#E0F0FF]">
            {/* Clouds */}
            <div className="absolute top-2 left-2 w-8 h-3 bg-white/90 rounded-full" />
            <div className="absolute top-3 left-8 w-10 h-3.5 bg-white/85 rounded-full" />
            <div className="absolute top-4 left-3 w-6 h-2.5 bg-white/80 rounded-full" />
            <div className="absolute top-1.5 right-2 w-7 h-2.5 bg-white/85 rounded-full" />
            <div className="absolute top-3 right-6 w-5 h-2 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[#E8D5C8]" />

        {/* Baseboard */}
        <div className="absolute bottom-[45%] left-0 right-0 h-[5px] bg-[#D4C4A8]" />

        {/* Rug */}
        <div
          className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-52 h-20 rounded-[50%] opacity-70"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(245, 158, 107, 0.12) 0%, rgba(240, 232, 223, 0.6) 40%, rgba(240, 232, 223, 0.3) 100%)',
          }}
        />

        {/* Scratching post - left */}
        <div className="absolute bottom-[38%] left-[8%]">
          {/* Post */}
          <div className="w-3 h-20 bg-[#D4C4A8] rounded-t-sm mx-auto relative">
            <div className="absolute top-0 -mt-1 w-5 h-2 bg-[#F59E6B] rounded-full left-1/2 -translate-x-1/2" />
          </div>
          {/* Base */}
          <div className="w-10 h-2 bg-[#C4B8AF] rounded-sm -mt-0.5 mx-auto" />
        </div>

        {/* Food bowl - right */}
        <div className="absolute bottom-[40%] right-[12%]">
          <div className="w-10 h-5 bg-[#F5E6D3] rounded-b-full border-2 border-[#D4C4A8] relative overflow-hidden">
            <div className="absolute inset-x-1 top-1 h-2 rounded-full bg-[#8B7355]/40" />
          </div>
        </div>

        {/* Toy ball - bottom right */}
        <motion.div
          className="absolute bottom-[42%] right-[22%] w-4 h-4 rounded-full bg-[#F0A8B8]/50 border border-[#F0A8B8]/30"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
        />
      </div>

      {/* ===== Content Layer ===== */}
      <div className="relative z-10 flex flex-col min-h-[calc(100dvh-152px)] pt-4 pb-4 safe-bottom">
        {/* ---- Cat Selector ---- */}
        {cats.length > 1 && (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-7 h-7 rounded-full bg-white/80 border border-[var(--color-border)] flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
                aria-label="向左滑动"
              >
                <ChevronLeft size={14} className="text-[var(--color-text-sub)]" />
              </button>

              <div className="flex-1 overflow-hidden">
                <motion.div
                  className="flex gap-2.5"
                  animate={{ x: -selectorScroll }}
                  transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                >
                  {cats.map((cat) => {
                    const isSelected = selectedCat.id === cat.id;
                    const isAway = cat.is_away;
                    return (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setSelectedCat(cat)}
                        disabled={catActionLoading}
                        className={`relative flex flex-col items-center gap-1 shrink-0 rounded-2xl px-2.5 py-2 transition-all ${
                          isSelected
                            ? 'bg-white shadow-md shadow-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]/30 scale-105'
                            : 'bg-white/60 hover:bg-white/90'
                        } ${isAway ? 'opacity-50' : ''}`}
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--color-border)]/40 flex items-center justify-center">
                          <CatMiniSvg cat={cat} />
                        </div>
                        <span
                          className={`text-[10px] font-medium truncate max-w-[60px] ${
                            isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-sub)]'
                          }`}
                        >
                          {cat.name}
                        </span>
                        {isAway && (
                          <span className="absolute -top-1 -right-1 text-[10px]" title="离家出走中">
                            💤
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-7 h-7 rounded-full bg-white/80 border border-[var(--color-border)] flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
                aria-label="向右滑动"
              >
                <ChevronRight size={14} className="text-[var(--color-text-sub)]" />
              </button>
            </div>
          </div>
        )}

        {/* ---- Cat Display Area ---- */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Glow effect based on rarity */}
          <div
            ref={catDisplayRef}
            className="relative flex items-center justify-center"
          >
            {/* Rarity glow behind cat */}
            <div
              className="absolute inset-0 w-44 h-44 rounded-full opacity-40 blur-xl"
              style={{ backgroundColor: rarityGlow.glow }}
            />

            {/* Rarity badge */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white z-20"
              style={{ backgroundColor: rarityGlow.badge }}
            >
              Lv.{selectedCat.level} · {RARITY_LABELS[selectedCat.rarity] ?? selectedCat.rarity}
            </div>

            {/* Toy (play mode) */}
            <AnimatePresence>
              {interactionState === 'playing' && (
                <motion.div
                  className="absolute z-10 w-5 h-5 rounded-full bg-[#F0A8B8] border-2 border-[#F59E6B]/60"
                  animate={{ x: toyPos.x, y: toyPos.y }}
                  transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                />
              )}
            </AnimatePresence>

            {/* Cat SVG with animations */}
            <motion.div
              className="relative z-10"
              variants={catAnimationVariants}
              animate={interactionState}
              initial="idle"
            >
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                <CatSvg cat={selectedCat} className="w-full h-full" />
              </div>
            </motion.div>

            {/* Cat name */}
            <motion.p
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm font-semibold text-[var(--color-text)] whitespace-nowrap"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {selectedCat.name}
            </motion.p>
          </div>

          {/* ---- Status Bars ---- */}
          <div className="w-full max-w-xs mt-10 space-y-2.5">
            <StatusBar
              label="饱腹"
              emoji="🍖"
              value={selectedCat.hunger}
              color="#F59E6B"
            />
            <StatusBar
              label="心情"
              emoji="😊"
              value={selectedCat.mood}
              color="#F0A8B8"
            />
            <StatusBar
              label="精力"
              emoji="⚡"
              value={selectedCat.energy}
              color="#84CC94"
            />
          </div>
        </div>

        {/* ---- Interaction Buttons ---- */}
        <div className="px-4 pt-5">
          <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
            {/* Feed button */}
            <motion.button
              type="button"
              whileTap={{ scale: cooldowns.feed ? 1 : 0.9 }}
              whileHover={!cooldowns.feed ? { scale: 1.03 } : {}}
              onClick={() => handleAction('feed')}
              disabled={!!cooldowns.feed || interactionState !== 'idle'}
              className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-medium text-sm transition-all min-w-[80px] ${
                cooldowns.feed || interactionState !== 'idle'
                  ? 'bg-[var(--color-border)]/60 text-[var(--color-text-muted)] cursor-not-allowed'
                  : 'bg-white text-[var(--color-primary)] shadow-md hover:shadow-lg border border-[var(--color-border)]'
              }`}
            >
              <Cookie size={20} />
              <span>喂食</span>
              {cooldowns.feed && (
                <span className="text-[10px] text-[var(--color-text-muted)]">冷却中</span>
              )}
            </motion.button>

            {/* Play button */}
            <motion.button
              type="button"
              whileTap={{ scale: cooldowns.play ? 1 : 0.9 }}
              whileHover={!cooldowns.play ? { scale: 1.03 } : {}}
              onClick={() => handleAction('play')}
              disabled={!!cooldowns.play || interactionState !== 'idle'}
              className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-medium text-sm transition-all min-w-[80px] ${
                cooldowns.play || interactionState !== 'idle'
                  ? 'bg-[var(--color-border)]/60 text-[var(--color-text-muted)] cursor-not-allowed'
                  : 'bg-white text-[var(--color-secondary)] shadow-md hover:shadow-lg border border-[var(--color-border)]'
              }`}
            >
              <Gamepad2 size={20} />
              <span>玩耍</span>
              {cooldowns.play && (
                <span className="text-[10px] text-[var(--color-text-muted)]">冷却中</span>
              )}
            </motion.button>

            {/* Pet button - no cooldown, can spam */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => handleAction('pet')}
              disabled={interactionState !== 'idle' && interactionState !== 'purring'}
              className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-medium text-sm transition-all min-w-[80px] ${
                interactionState !== 'idle' && interactionState !== 'purring'
                  ? 'bg-[var(--color-border)]/60 text-[var(--color-text-muted)] cursor-not-allowed'
                  : 'bg-white text-[var(--color-accent)] shadow-md hover:shadow-lg border border-[var(--color-border)]'
              }`}
            >
              <Heart size={20} />
              <span>抚摸</span>
            </motion.button>
          </div>

          {/* Gentle hint text */}
          <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-3">
            {interactionState === 'feeding'
              ? '正在喂食中...'
              : interactionState === 'playing'
                ? '正在玩耍中...'
                : interactionState === 'purring'
                  ? '好舒服喵~'
                  : '每天记得来照顾你的猫咪哦'}
          </p>
        </div>
      </div>

      {/* ===== Effects Layer (Hearts) ===== */}
      <AnimatePresence>
        {hearts.map((h) => (
          <FlyingHeart key={h.id} id={h.id} x={h.x} y={h.y} />
        ))}
      </AnimatePresence>
    </div>
  );
}

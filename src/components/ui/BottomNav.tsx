'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Map, Home, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/map', label: '探索', icon: Map },
  { path: '/catbox', label: '猫箱', icon: Home },
  { path: '/profile', label: '我的', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-[var(--color-border)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || (tab.path === '/' && pathname === '/');
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="relative flex flex-col items-center justify-center w-full h-full group"
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <tab.icon
                  size={22}
                  className={isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)]'
                  }
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </motion.div>
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  isActive
                    ? 'text-[var(--color-primary)] font-medium'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[var(--color-primary)]"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

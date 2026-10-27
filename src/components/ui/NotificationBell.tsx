'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';

export default function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, isGuest } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (isGuest) return null;

  return (
    <div className="relative">
      <button aria-label="打开通知"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-[var(--color-border)] 
                   hover:bg-white transition-colors shadow-sm"
      >
        <Bell size={18} className="text-[var(--color-text)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-accent)] 
                           text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl 
                         bg-white border border-[var(--color-border)] shadow-lg z-50"
            >
              <div className="p-2 border-b border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-text-sub)] px-2">通知</p>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-[var(--color-text-muted)]">暂无通知</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left p-3 border-b border-[var(--color-border)] 
                              last:border-0 hover:bg-[var(--color-bg)] transition-colors ${
                                !n.is_read ? 'bg-orange-50/50' : ''
                              }`}
                  >
                    <p className="text-xs font-medium text-[var(--color-text)]">{n.title}</p>
                    <p className="text-[11px] text-[var(--color-text-sub)] mt-0.5 line-clamp-2">{n.message}</p>
                  </button>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

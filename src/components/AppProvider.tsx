'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { cloudEnabled } from '@/lib/runtime-config';
import { DEMO_USER_ID } from '@/lib/demo-state';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const { setUser, setGuest, setLoading, fetchProfile, fetchCats, fetchNotifications } = useAuthStore();

  useEffect(() => {
    if (!cloudEnabled) {
      setUser({ id: DEMO_USER_ID });
      setGuest(false);
      void Promise.all([fetchProfile(), fetchCats(), fetchNotifications()]).then(() => {setLoading(false);setHydrated(true);});
      return;
    }
    const supabase = getSupabaseClient();
    
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setGuest(false);
        fetchProfile();
        fetchCats();
        fetchNotifications();
      } else {
        setGuest(true);
      }
      setLoading(false);
      setHydrated(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setGuest(false);
        fetchProfile();
        fetchCats();
      } else {
        setUser(null);
        setGuest(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setGuest, setLoading, fetchProfile, fetchCats, fetchNotifications]);

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-cat-bounce">🐱</span>
          <p className="text-sm text-[var(--color-text-sub)]">地图猫箱加载中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

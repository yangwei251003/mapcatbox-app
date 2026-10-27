import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile, Cat, Notification } from '@/types';
import { cloudEnabled } from '@/lib/runtime-config';
import { readDemo, saveDemo, resetDemo } from '@/lib/demo-state';

interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  cats: Cat[];
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isGuest: boolean;

  setUser: (user: { id: string; email?: string } | null) => void;
  setProfile: (profile: Profile | null) => void;
  setGuest: (guest: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  fetchProfile: () => Promise<void>;
  fetchCats: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  
  signUp: (email: string, password: string, username: string, catData: Partial<Profile>) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  cats: [],
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  isGuest: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setGuest: (isGuest) => set({ isGuest }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async () => {
    if (!cloudEnabled) {set({profile:readDemo().profile});return;}
    const { user } = get();
    if (!user) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) set({ profile: data as Profile });
  },

  fetchCats: async () => {
    if (!cloudEnabled) {set({cats:[...readDemo().cats]});return;}
    const { user } = get();
    if (!user) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('cats')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });
    if (data) set({ cats: data as Cat[] });
  },

  fetchNotifications: async () => {
    if (!cloudEnabled) {const notifications=[...readDemo().notifications];set({notifications,unreadCount:notifications.filter(n=>!n.is_read).length});return;}
    const { user } = get();
    if (!user) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      const notifs = data as Notification[];
      set({ 
        notifications: notifs, 
        unreadCount: notifs.filter(n => !n.is_read).length 
      });
    }
  },

  markNotificationRead: async (id: string) => {
    if (!cloudEnabled) {const state=readDemo();state.notifications=state.notifications.map(n=>n.id===id?{...n,is_read:true}:n);saveDemo(state);await get().fetchNotifications();return;}
    const supabase = getSupabaseClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    const { notifications } = get();
    set({ notifications: notifications.map(n => n.id === id ? { ...n, is_read: true } : n) });
  },

  signUp: async (email, password, username, catData) => {
    if (!cloudEnabled) return {error:'离线演示没有注册或密码功能，请使用合成用户。'};
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: '注册失败' };

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username,
      ...catData,
    });
    if (profileError) return { error: profileError.message };

    // Create initial cat food
    await supabase.from('cat_food').insert({ user_id: authData.user.id, amount: 5 });
    
    // Create first cat
    await supabase.from('cats').insert({
      owner_id: authData.user.id,
      name: catData.cat_name || '小咪',
      breed: catData.cat_breed || '田园猫',
      color: catData.cat_color || 'orange',
      personality: 'friendly',
    });

    set({ user: { id: authData.user.id, email }, isGuest: false });
    await get().fetchProfile();
    await get().fetchCats();
    return {};
  },

  signIn: async (email, password) => {
    if (!cloudEnabled) return {error:'离线演示不接收账号密码，请使用合成用户。'};
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      set({ user: { id: data.user.id, email: data.user.email }, isGuest: false });
      await get().fetchProfile();
      await get().fetchCats();
      await get().fetchNotifications();
    }
    return {};
  },

  signOut: async () => {
    if (!cloudEnabled) {const state=resetDemo();set({profile:state.profile,cats:[...state.cats],notifications:[...state.notifications],unreadCount:1});return;}
    const {useMapStore}=await import('./map-store');
    await useMapStore.getState().stopLocationTracking();
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, cats: [], isGuest: true });
  },

  updateProfile: async (updates) => {
    if (!cloudEnabled) {const state=readDemo();state.profile={...state.profile,...updates};saveDemo(state);set({profile:state.profile});return;}
    if (updates.visibility==='invisible') {const {useMapStore}=await import('./map-store');await useMapStore.getState().stopLocationTracking();}
    const { user } = get();
    if (!user) return;
    const supabase = getSupabaseClient();
    await supabase.from('profiles').update(updates).eq('id', user.id);
    await get().fetchProfile();
  },
}));

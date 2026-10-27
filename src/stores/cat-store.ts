import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Cat, CatInteraction, CatDiary, CatAccessory } from '@/types';
import { cloudEnabled } from '@/lib/runtime-config';
import { readDemo, saveDemo, interactDemo } from '@/lib/demo-state';
import { useAuthStore } from './auth-store';

interface CatState {
  selectedCat: Cat | null;
  interactions: CatInteraction[];
  diaries: CatDiary[];
  loading: boolean;

  setSelectedCat: (cat: Cat | null) => void;
  
  feed: (catId: string) => Promise<void>;
  play: (catId: string) => Promise<void>;
  pet: (catId: string) => Promise<void>;
  
  fetchInteractions: (catId: string) => Promise<void>;
  fetchDiaries: (catId: string) => Promise<void>;
  fetchAccessories: (catId: string) => Promise<CatAccessory[]>;
  
  toggleAccessory: (catId: string, accessoryId: string) => Promise<void>;
}

export const useCatStore = create<CatState>((set, get) => ({
  selectedCat: null,
  interactions: [],
  diaries: [],
  loading: false,

  setSelectedCat: (cat) => set({ selectedCat: cat }),

  feed: async (catId: string) => {
    if (!cloudEnabled) {set({selectedCat:interactDemo(catId,'feed')});await useAuthStore.getState().fetchCats();return;}
    const supabase = getSupabaseClient();
    // Update hunger
    await supabase.rpc('feed_cat', { cat_id: catId });
    // Record interaction
    await supabase.from('cat_interactions').insert({
      cat_id: catId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      interaction_type: 'feed',
    });
    // Refresh cats
    set({ loading: true });
    const { selectedCat } = get();
    if (selectedCat) {
      set({ selectedCat: { ...selectedCat, hunger: Math.min(100, selectedCat.hunger + 20) } });
    }
    set({ loading: false });
  },

  play: async (catId: string) => {
    if (!cloudEnabled) {set({selectedCat:interactDemo(catId,'play')});await useAuthStore.getState().fetchCats();return;}
    const supabase = getSupabaseClient();
    await supabase.rpc('play_with_cat', { cat_id: catId });
    await supabase.from('cat_interactions').insert({
      cat_id: catId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      interaction_type: 'play',
    });
    const { selectedCat } = get();
    if (selectedCat) {
      set({ 
        selectedCat: { 
          ...selectedCat, 
          mood: Math.min(100, selectedCat.mood + 20),
          energy: Math.max(0, selectedCat.energy - 10),
        } 
      });
    }
  },

  pet: async (catId: string) => {
    if (!cloudEnabled) {set({selectedCat:interactDemo(catId,'pet')});await useAuthStore.getState().fetchCats();return;}
    const { selectedCat } = get();
    if (selectedCat) {
      set({ selectedCat: { ...selectedCat, mood: Math.min(100, selectedCat.mood + 5) } });
    }
  },

  fetchInteractions: async (catId: string) => {
    if (!cloudEnabled) {set({interactions:readDemo().interactions.filter(x=>x.cat_id===catId)});return;}
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('cat_interactions')
      .select('*')
      .eq('cat_id', catId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) set({ interactions: data as CatInteraction[] });
  },

  fetchDiaries: async (catId: string) => {
    if (!cloudEnabled) {set({diaries:readDemo().diaries.filter(x=>x.cat_id===catId)});return;}
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('cat_diaries')
      .select('*')
      .eq('cat_id', catId)
      .order('date', { ascending: false })
      .limit(30);
    if (data) set({ diaries: data as CatDiary[] });
  },

  fetchAccessories: async (catId: string) => {
    if (!cloudEnabled) return readDemo().accessories.filter(x=>x.cat_id===catId);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('cat_accessories')
      .select('*')
      .eq('cat_id', catId);
    return (data as CatAccessory[]) || [];
  },

  toggleAccessory: async (catId: string, accessoryId: string) => {
    if (!cloudEnabled) {const state=readDemo();state.accessories=state.accessories.map(x=>x.cat_id===catId&&x.id===accessoryId?{...x,equipped:!x.equipped}:x);saveDemo(state);return;}
    const supabase = getSupabaseClient();
    const accessories = await get().fetchAccessories(catId);
    const acc = accessories.find(a => a.id === accessoryId);
    if (acc) {
      await supabase.from('cat_accessories').update({ equipped: !acc.equipped }).eq('id', accessoryId);
    }
  },
}));

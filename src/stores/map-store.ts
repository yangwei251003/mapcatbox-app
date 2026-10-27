import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Location, StrayCat } from '@/types';
import { cloudEnabled, deviceLocationEnabled } from '@/lib/runtime-config';
import { demoStrays } from '@/lib/demo-state';
import { createLocationWriter } from '@/lib/location-writer';
let locationWriter:ReturnType<typeof createLocationWriter>|null=null;
let trackedUserId:string|null=null;

interface MapState {
  userLocation: { lat: number; lng: number } | null;
  friendLocations: Location[];
  nearbyStrayCats: StrayCat[];
  selectedMarker: { type: 'friend' | 'stray'; id: string } | null;
  loading: boolean;

  setUserLocation: (loc: { lat: number; lng: number }) => void;
  setSelectedMarker: (marker: { type: 'friend' | 'stray'; id: string } | null) => void;
  
  startLocationTracking: (userId: string) => void;
  stopLocationTracking: () => Promise<void>;
  fetchFriendLocations: () => Promise<void>;
  fetchNearbyStrayCats: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  subscribeToFriends: () => void;

  _watchId: number | null;
}

export const useMapStore = create<MapState>((set, get) => ({
  userLocation: null,
  friendLocations: [],
  nearbyStrayCats: [],
  selectedMarker: null,
  loading: false,
  _watchId: null,

  setUserLocation: (loc) => set({ userLocation: loc }),
  setSelectedMarker: (marker) => set({ selectedMarker: marker }),

  startLocationTracking: (userId: string) => {
    if (!deviceLocationEnabled || !navigator.geolocation || get()._watchId!==null) return;
    trackedUserId=userId;
    const writer=createLocationWriter(async(sample)=>{
      const {error}=await getSupabaseClient().from('locations').upsert({user_id:userId,...sample,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(error)throw error;
    });
    locationWriter=writer;
    
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        set({ userLocation: loc });
        
        // An actual monotonic 30s attempt limit, independent of GPS cache maximumAge.
        try {const wrote=await writer.submit({latitude:loc.lat,longitude:loc.lng,accuracy:pos.coords.accuracy});if(wrote)await get().fetchNearbyStrayCats(loc.lat,loc.lng,20);} catch {console.warn('位置共享失败，请停止共享后检查个人云配置。');}
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 }
    );

    set({ _watchId: watchId });
  },

  stopLocationTracking: async () => {
    const writer=locationWriter;const userId=trackedUserId;locationWriter=null;trackedUserId=null;
    const { _watchId } = get();
    if (_watchId !== null) {
      navigator.geolocation.clearWatch(_watchId);
      set({ _watchId: null });
    }
    // Wait for any in-flight write before deleting: a late upsert cannot recreate the revoked record.
    await writer?.stop();
    if (cloudEnabled && userId) {
      const {error}=await getSupabaseClient().from('locations').delete().eq('user_id',userId);
      if(error)throw error;
    }
  },

  fetchFriendLocations: async () => {
    if (!cloudEnabled) {set({friendLocations:[]});return;}
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get friend IDs
    const { data: friends } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!friends || friends.length === 0) return;

    const friendIds = friends.map((f: {user_id:string;friend_id:string}) => f.user_id === user.id ? f.friend_id : f.user_id);

    // Get friend locations
    const { data: locations } = await supabase
      .from('locations')
      .select('*, profiles!inner(username, cat_name, cat_color, avatar_url)')
      .in('user_id', friendIds);

    if (locations) set({ friendLocations: locations as unknown as Location[] });
  },

  fetchNearbyStrayCats: async (lat: number, lng: number, radiusKm = 10) => {
    if (!cloudEnabled) {set({nearbyStrayCats:[...demoStrays],loading:false});return;}
    set({ loading: true });
    const supabase = getSupabaseClient();
    
    // Simple bbox query
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const { data } = await supabase
      .from('stray_cats')
      .select('*')
      .eq('is_found', false)
      .gte('latitude', lat - latDelta)
      .lte('latitude', lat + latDelta)
      .gte('longitude', lng - lngDelta)
      .lte('longitude', lng + lngDelta)
      .limit(20);

    if (data) {
      // Filter by actual distance
      const nearby = (data as StrayCat[]).filter(cat => {
        const dist = Math.sqrt(
          Math.pow((cat.latitude - lat) * 111, 2) + 
          Math.pow((cat.longitude - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
        );
        return dist <= radiusKm;
      });
      set({ nearbyStrayCats: nearby, loading: false });
    } else {
      set({ loading: false });
    }
  },

  subscribeToFriends: () => {
    if (!cloudEnabled) return;
    // Subscribe to friend location changes via Realtime
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('friend-locations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'locations' },
        () => {
          get().fetchFriendLocations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
}));

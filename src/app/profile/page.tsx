'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CAT_BREEDS } from '@/types';
import type { Cat } from '@/types';
import { cloudEnabled } from '@/lib/runtime-config';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Settings, LogOut, Cat as CatIcon, Users, MapPin, Star, Edit3, ChevronRight, Heart, EyeOff, Eye } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, cats, isGuest, signOut, fetchCats, updateProfile } = useAuthStore();
  const [friendCount, setFriendCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled=false;
    if (!isGuest && user) {
      void fetchCats();
      if(cloudEnabled) {
        void getSupabaseClient().from('friendships')
          .select('*, friend_profile:profiles!friendships_friend_id_fkey(username, cat_name, cat_color, avatar_url)')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status','accepted')
          .then(({data}:{data:unknown[]|null})=>{if(!cancelled&&data)setFriendCount(data.length);});
      }
    }
    return ()=>{cancelled=true;};
  },[user,isGuest,fetchCats]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({ bio: editBio, cat_name: editName });
    setSaving(false);
    setEditing(false);
  };

  const startEdit = () => {
    setEditBio(profile?.bio || '');
    setEditName(profile?.cat_name || '');
    setEditing(true);
  };

  const toggleVisibility = async () => {
    const newVis = profile?.visibility === 'invisible' ? 'public' : 'invisible';
    await updateProfile({ visibility: newVis });
  };

  if (!user || isGuest) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-[var(--color-bg)] safe-bottom pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="text-6xl mb-4">🐱</div>
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">我的喵</h1>
          <p className="text-sm text-[var(--color-text-sub)] mb-6">注册账号，创建你的专属猫咪化身，开启地图社交之旅</p>
          <button aria-label="编辑演示资料"
            onClick={() => router.push('/auth')}
            className="px-8 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium
                       hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm text-sm"
          >
            注册 / 登录
          </button>
        </motion.div>
      </div>
    );
  }

  const breedInfo = CAT_BREEDS.find(b => b.name === profile?.cat_breed);

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] safe-bottom pb-24">
      {/* Profile Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Cat Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-200 to-pink-100 
                              flex items-center justify-center text-4xl shadow-sm border-2 border-white">
                🐱
              </div>
              <button
                onClick={toggleVisibility}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[var(--color-border)]
                           flex items-center justify-center shadow-sm"
              >
                {profile?.visibility === 'invisible' 
                  ? <EyeOff size={12} className="text-[var(--color-text-muted)]" />
                  : <Eye size={12} className="text-[var(--color-secondary)]" />
                }
              </button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text)]">{profile?.username || '用户'}</h1>
              <p className="text-sm text-[var(--color-text-sub)] flex items-center gap-1.5">
                <CatIcon size={14} />
                {profile?.cat_name || '未命名猫咪'}
                <span className="text-[var(--color-text-muted)]">·</span>
                {breedInfo?.name || profile?.cat_breed || '田园猫'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {profile?.bio || '这只猫咪还没有自我介绍...'}
              </p>
            </div>
          </div>
          <button aria-label="编辑演示资料"
            onClick={startEdit}
            className="p-2 rounded-xl bg-white border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <Edit3 size={16} className="text-[var(--color-text-sub)]" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-white rounded-2xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--color-primary)]">{cats.length}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">猫咪</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--color-accent)]">{friendCount}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">猫友</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--color-secondary)]">
              {cats.reduce((sum, c) => sum + (c.rarity === 'legendary' ? 5 : c.rarity === 'rare' ? 3 : c.rarity === 'uncommon' ? 2 : 1), 0)}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)]">收藏值</p>
          </div>
        </div>
      </div>

      {/* Cat Collection */}
      <div className="px-6 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Star size={14} className="text-[var(--color-primary)]" />
          我的猫咪
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {cats.map((cat: Cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-24 h-32 rounded-2xl bg-white border border-[var(--color-border)]
                         flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer
                         hover:border-[var(--color-primary)]/30 transition-colors"
            >
              <div className={`text-3xl ${cat.is_away ? 'opacity-40' : ''}`}>
                🐱
              </div>
              <p className={`text-xs font-medium ${cat.is_away ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text)]'}`}>
                {cat.name}
              </p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                cat.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                cat.rarity === 'rare' ? 'bg-purple-100 text-purple-700' :
                cat.rarity === 'uncommon' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {cat.rarity === 'legendary' ? '传说' : cat.rarity === 'rare' ? '稀有' : cat.rarity === 'uncommon' ? '少见' : '普通'}
              </span>
            </motion.div>
          ))}
          {cats.length < 3 && (
            <button
              onClick={() => router.push('/map')}
              className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-dashed border-[var(--color-border)]
                         flex flex-col items-center justify-center gap-1 hover:border-[var(--color-primary)]/30 transition-colors"
            >
              <span className="text-2xl text-[var(--color-text-muted)]">+</span>
              <p className="text-[10px] text-[var(--color-text-muted)]">发现猫咪</p>
            </button>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="px-6 space-y-1">
        <MenuItem icon={Users} label="猫友（列表待实现）" onClick={() => {}} count={friendCount} />
        <MenuItem icon={Heart} label="互动记录（页面待实现）" onClick={() => {}} />
        <MenuItem icon={MapPin} label="位置隐私" onClick={toggleVisibility}
          right={profile?.visibility === 'invisible' ? '隐身中' : '公开'} />
        <MenuItem icon={Settings} label="设置（待实现）" onClick={() => {}} />
        <MenuItem icon={LogOut} label={cloudEnabled?'退出登录':'重置合成演示'} onClick={() => { void signOut().then(()=>{window.location.reload();}); }} danger />
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <div className="fixed inset-0 bg-black/20 z-[990]" onClick={() => setEditing(false)} />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[2rem] p-6 shadow-xl safe-bottom"
            >
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">编辑资料</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-sub)] block mb-1">猫咪昵称</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]
                               text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-sub)] block mb-1">简介</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]
                               text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium
                             hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ 
  icon: Icon, label, onClick, count, right, danger 
}: { 
  icon: LucideIcon; label: string; onClick: () => void; count?: number; right?: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[var(--color-border)]
                 hover:bg-[var(--color-bg)] transition-colors text-left"
    >
      <Icon size={18} className={danger ? 'text-red-400' : 'text-[var(--color-text-sub)]'} />
      <span className={`flex-1 text-sm ${danger ? 'text-red-400' : 'text-[var(--color-text)]'}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
      {right && <span className="text-xs text-[var(--color-text-muted)]">{right}</span>}
      <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
    </button>
  );
}

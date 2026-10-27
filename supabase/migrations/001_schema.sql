-- MapCatBox Database Schema
-- 地图猫箱核心数据结构

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Profiles: 用户资料（猫咪化身）
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  cat_name TEXT NOT NULL DEFAULT '未命名猫咪',
  cat_breed TEXT NOT NULL DEFAULT '田园猫',
  cat_color TEXT NOT NULL DEFAULT 'orange',
  cat_eyes TEXT NOT NULL DEFAULT 'round_yellow',
  cat_accessory TEXT DEFAULT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  theme_preference TEXT DEFAULT 'warm',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'invisible')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Cats: 用户拥有的猫咪
-- ============================================================
CREATE TABLE cats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT NOT NULL DEFAULT '田园猫',
  color TEXT NOT NULL DEFAULT 'orange',
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  personality TEXT DEFAULT 'friendly',
  story TEXT DEFAULT '',
  adopted_at TIMESTAMPTZ DEFAULT NOW(),
  evolved_at TIMESTAMPTZ DEFAULT NULL,
  level INTEGER DEFAULT 1,
  hunger INTEGER DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
  mood INTEGER DEFAULT 80 CHECK (mood >= 0 AND mood <= 100),
  energy INTEGER DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  is_away BOOLEAN DEFAULT FALSE,
  away_since TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Cat Accessories: 猫咪配饰
-- ============================================================
CREATE TABLE cat_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  accessory_type TEXT NOT NULL,
  accessory_name TEXT NOT NULL,
  equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Locations: 实时位置
-- ============================================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_updated ON locations(updated_at);

-- ============================================================
-- Friendships: 好友关系
-- ============================================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================================
-- Stray Cats: 系统生成的流浪猫
-- ============================================================
CREATE TABLE stray_cats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  color TEXT NOT NULL,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  personality TEXT DEFAULT 'wild',
  story TEXT DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT '广州',
  is_found BOOLEAN DEFAULT FALSE,
  found_by UUID DEFAULT NULL REFERENCES profiles(id),
  found_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Cat Interactions: 猫咪互动记录
-- ============================================================
CREATE TABLE cat_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('feed', 'play', 'pet', 'dress', 'gift_food')),
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_cat ON cat_interactions(cat_id, created_at);

-- ============================================================
-- Cat Diaries: 猫咪日记
-- ============================================================
CREATE TABLE cat_diaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  highlights JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cat_id, date)
);

-- ============================================================
-- Check Ins: 每日签到
-- ============================================================
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak INTEGER DEFAULT 1,
  reward TEXT DEFAULT '1 cat food',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);

-- ============================================================
-- Notifications: 通知
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'gift_received', 'cat_hungry', 'cat_away', 'stray_nearby', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- ============================================================
-- Cat Food: 猫粮库存
-- ============================================================
CREATE TABLE cat_food (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER DEFAULT 3 CHECK (amount >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stray_cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_food ENABLE ROW LEVEL SECURITY;

-- Profiles: 用户可读自己的，公开可见的可读所有人的
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cats: 自己可见，公开的别人也可见
CREATE POLICY "Cats viewable by owner or public" ON cats
  FOR SELECT USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = cats.owner_id AND visibility = 'public'
  ));

CREATE POLICY "Users can manage own cats" ON cats
  FOR ALL USING (owner_id = auth.uid());

-- Locations: 公开写入自己，读取好友的
CREATE POLICY "Users manage own location" ON locations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Friends can see location" ON locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM friendships WHERE 
      ((friendships.user_id = locations.user_id AND friendships.friend_id = auth.uid())
       OR (friendships.friend_id = locations.user_id AND friendships.user_id = auth.uid()))
      AND friendships.status = 'accepted'
    )
  );

-- Friendships
CREATE POLICY "Users manage own friendships" ON friendships
  FOR ALL USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Stray cats: 所有人可见
CREATE POLICY "Stray cats viewable by all" ON stray_cats
  FOR SELECT USING (true);

-- Cat interactions
CREATE POLICY "Interactions viewable by cat owner" ON cat_interactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cats WHERE cats.id = cat_interactions.cat_id AND cats.owner_id = auth.uid()
  ));

CREATE POLICY "Users can interact" ON cat_interactions
  FOR INSERT WITH CHECK (true);

-- Cat diaries: 猫主人可见
CREATE POLICY "Diaries viewable by cat owner" ON cat_diaries
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cats WHERE cats.id = cat_diaries.cat_id AND cats.owner_id = auth.uid()
  ));

CREATE POLICY "Diaries managed by cat owner" ON cat_diaries
  FOR ALL USING (EXISTS (
    SELECT 1 FROM cats WHERE cats.id = cat_diaries.cat_id AND cats.owner_id = auth.uid()
  ));

-- Check-ins
CREATE POLICY "Users manage own check-ins" ON check_ins
  FOR ALL USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Cat food
CREATE POLICY "Users manage own food" ON cat_food
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- Realtime subscriptions
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE locations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE cats;

-- ============================================================
-- Functions
-- ============================================================
-- 计算两点间距离（米）
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN SQRT((lat1 - lat2)^2 + (lng1 - lng2)^2) * 111000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 猫咪状态随时间衰减（通过定时Edge Function调用）
CREATE OR REPLACE FUNCTION decay_cat_stats()
RETURNS void AS $$
BEGIN
  UPDATE cats
  SET 
    hunger = GREATEST(0, hunger - 1),
    mood = GREATEST(0, mood - 1),
    energy = GREATEST(0, energy - 1),
    updated_at = NOW()
  WHERE updated_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

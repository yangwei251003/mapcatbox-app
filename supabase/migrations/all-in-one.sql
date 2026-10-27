-- Same 001 + 002 + SYNTHETIC 003 + privacy 004. NEW EMPTY isolated projects only; do not also run individual files. NOT database-tested.
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

-- Supabase RPC Functions for MapCatBox

-- Feed a cat: increase hunger
CREATE OR REPLACE FUNCTION feed_cat(cat_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE cats 
  SET hunger = LEAST(100, hunger + 20), updated_at = NOW()
  WHERE id = cat_id;
  
  -- Decrease cat food
  UPDATE cat_food 
  SET amount = GREATEST(0, amount - 1), updated_at = NOW()
  WHERE user_id = (SELECT owner_id FROM cats WHERE id = cat_id);
END;
$$ LANGUAGE plpgsql;

-- Play with a cat: increase mood, decrease energy
CREATE OR REPLACE FUNCTION play_with_cat(cat_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE cats 
  SET mood = LEAST(100, mood + 20),
      energy = GREATEST(0, energy - 10),
      updated_at = NOW()
  WHERE id = cat_id;
END;
$$ LANGUAGE plpgsql;

-- Discover stray cat: mark as found
CREATE OR REPLACE FUNCTION discover_stray_cat(stray_id UUID, finder_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stray_cats 
  SET is_found = TRUE, found_by = finder_id, found_at = NOW()
  WHERE id = stray_id AND is_found = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Adopt a stray cat: create pet cat from stray
CREATE OR REPLACE FUNCTION adopt_stray_cat(stray_id UUID, adopter_id UUID, new_name TEXT)
RETURNS UUID AS $$
DECLARE
  stray_record RECORD;
  new_cat_id UUID;
BEGIN
  SELECT * INTO stray_record FROM stray_cats WHERE id = stray_id AND is_found = FALSE;
  
  IF stray_record IS NULL THEN
    RAISE EXCEPTION 'Stray cat not found or already adopted';
  END IF;

  -- Mark stray as found
  UPDATE stray_cats SET is_found = TRUE, found_by = adopter_id, found_at = NOW()
  WHERE id = stray_id;

  -- Create new cat
  INSERT INTO cats (owner_id, name, breed, color, rarity, personality, story)
  VALUES (adopter_id, new_name, stray_record.breed, stray_record.color, 
          stray_record.rarity, stray_record.personality, stray_record.story)
  RETURNING id INTO new_cat_id;

  RETURN new_cat_id;
END;
$$ LANGUAGE plpgsql;

-- Get check-in streak
CREATE OR REPLACE FUNCTION get_checkin_streak(uid UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  current_date DATE := CURRENT_DATE;
BEGIN
  LOOP
    IF EXISTS (SELECT 1 FROM check_ins WHERE user_id = uid AND check_date = current_date) THEN
      streak := streak + 1;
      current_date := current_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- SYNTHETIC ONLY: mathematical demo points, not real geography.
INSERT INTO stray_cats (name, breed, color, rarity, personality, story, latitude, longitude, city) VALUES
('演示猫1', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', -18, -24, '合成网格'),
('演示猫2', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', -12, -7, '合成网格'),
('演示猫3', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', -20, 12, '合成网格'),
('演示猫4', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', -8, 26, '合成网格'),
('演示猫5', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', 16, -22, '合成网格'),
('演示猫6', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', 22, -6, '合成网格'),
('演示猫7', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', 10, 10, '合成网格'),
('演示猫8', '田园猫', 'orange', 'common', 'friendly', '虚构猫咪与数学网格示例，不代表现实动物或地点', 25, 24, '合成网格');

-- PUBLIC SNAPSHOT PRIVACY PATCH. Review on an isolated database before any personal deployment.
-- No real database was connected or migrated during this archive.
ALTER TABLE profiles ALTER COLUMN visibility SET DEFAULT 'invisible';
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles respect visibility" ON profiles FOR SELECT USING (
  id = auth.uid() OR visibility = 'public' OR (
    visibility = 'friends_only' AND EXISTS (
      SELECT 1 FROM friendships f WHERE f.status = 'accepted' AND
      ((f.user_id = profiles.id AND f.friend_id = auth.uid()) OR
       (f.friend_id = profiles.id AND f.user_id = auth.uid()))
    )
  )
);
DROP POLICY IF EXISTS "Friends can see location" ON locations;
CREATE POLICY "Visible accepted friends can see location" ON locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = locations.user_id AND p.visibility IN ('public','friends_only'))
  AND EXISTS (SELECT 1 FROM friendships f WHERE f.status = 'accepted' AND
    ((f.user_id = locations.user_id AND f.friend_id = auth.uid()) OR
     (f.friend_id = locations.user_id AND f.user_id = auth.uid())))
);
DROP POLICY IF EXISTS "Users can interact" ON cat_interactions;
CREATE POLICY "Owners record own cat interactions" ON cat_interactions FOR INSERT WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM cats c WHERE c.id = cat_interactions.cat_id AND c.owner_id = auth.uid())
);

-- A requester cannot manufacture an already-accepted friendship to read a target's location.
DROP POLICY IF EXISTS "Users manage own friendships" ON friendships;
CREATE POLICY "Participants read friendships" ON friendships FOR SELECT USING (user_id=auth.uid() OR friend_id=auth.uid());
CREATE POLICY "Requesters create pending friendships" ON friendships FOR INSERT WITH CHECK (user_id=auth.uid() AND friend_id<>auth.uid() AND status='pending');
CREATE POLICY "Recipients respond to requests" ON friendships FOR UPDATE USING (friend_id=auth.uid() AND status='pending') WITH CHECK (friend_id=auth.uid() AND status IN ('accepted','blocked'));
CREATE POLICY "Participants revoke friendship" ON friendships FOR UPDATE USING ((user_id=auth.uid() OR friend_id=auth.uid()) AND status IN ('pending','accepted')) WITH CHECK ((user_id=auth.uid() OR friend_id=auth.uid()) AND status='blocked');
CREATE POLICY "Participants delete friendship" ON friendships FOR DELETE USING (user_id=auth.uid() OR friend_id=auth.uid());
CREATE OR REPLACE FUNCTION protect_friendship_identity() RETURNS trigger AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.friend_id IS DISTINCT FROM OLD.friend_id THEN
    RAISE EXCEPTION 'Friendship identity cannot be changed';
  END IF;
  NEW.updated_at=NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER friendship_identity_immutable BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION protect_friendship_identity();


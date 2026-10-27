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

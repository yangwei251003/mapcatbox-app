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

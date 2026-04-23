-- ACHIEVEMENTS & LOOT SCHEMA + AUTO-CLEANUP

-- 1. Player Stats tracking
CREATE TABLE IF NOT EXISTS player_stats (
  temp_user_id TEXT PRIMARY KEY,
  raids_joined INTEGER DEFAULT 0,
  events_joined INTEGER DEFAULT 0,
  revivals_completed INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL, -- e.g. 'raid_veteran', 'first_event'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(temp_user_id, achievement_id)
);

-- 3. Loot Drops
CREATE TABLE IF NOT EXISTS loot_drops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temp_user_id TEXT NOT NULL,
  item_id TEXT NOT NULL, -- e.g. 'diamond_sword', 'golden_apple'
  item_name TEXT NOT NULL,
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  source_id UUID, -- session_id or event_id
  dropped_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Server Auto-Cleanup Function
-- This function checks if a server has players. If 0, it deletes the server.
CREATE OR REPLACE FUNCTION cleanup_empty_servers()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- If a player leaves, check if any players remain in that server
  IF (SELECT count(*) FROM server_players WHERE server_id = OLD.server_id) = 0 THEN
    DELETE FROM servers WHERE id = OLD.server_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Trigger cleanup when a player is removed from server_players
DROP TRIGGER IF EXISTS trigger_cleanup_empty_servers ON server_players;
CREATE TRIGGER trigger_cleanup_empty_servers
  AFTER DELETE ON server_players
  FOR EACH ROW
  EXECUTE PROCEDURE cleanup_empty_servers();

-- Enable RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access player_stats" ON player_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access user_achievements" ON user_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access loot_drops" ON loot_drops FOR ALL USING (true) WITH CHECK (true);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE player_stats, user_achievements, loot_drops;

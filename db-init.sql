-- QUEUEBUDDY FULL DATABASE INITIALIZATION
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. CLEANUP (Optional: Uncomment if you want to reset)
-- DROP TABLE IF EXISTS quick_messages;
-- DROP TABLE IF EXISTS server_players;
-- DROP TABLE IF EXISTS servers;
-- DROP TABLE IF EXISTS session_players;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS events;

-- 2. SERVERS & LOBBIES
CREATE TABLE IF NOT EXISTS servers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id      TEXT NOT NULL,
  game         TEXT NOT NULL,
  max_players  INTEGER DEFAULT 4,
  tags         TEXT[] DEFAULT '{}',
  connect_info TEXT NOT NULL,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  origin_id    UUID UNIQUE -- Used for session-to-lobby conversion
);

CREATE TABLE IF NOT EXISTS server_players (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id    UUID REFERENCES servers(id) ON DELETE CASCADE,
  temp_user_id TEXT NOT NULL,
  username     TEXT NOT NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, temp_user_id)
);

-- 3. QUICK MESSAGES (Chat)
CREATE TABLE IF NOT EXISTS quick_messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id    UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  temp_user_id TEXT NOT NULL,
  username     TEXT NOT NULL,
  text         TEXT NOT NULL CHECK (char_length(text) <= 200),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RAID SESSIONS (Scheduled)
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game             TEXT NOT NULL,
  time             TIMESTAMPTZ NOT NULL,
  max_players      INTEGER DEFAULT 5,
  creator_id       TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_players (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   UUID REFERENCES sessions(id) ON DELETE CASCADE,
  temp_user_id TEXT NOT NULL,
  username     TEXT NOT NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, temp_user_id)
);

-- 5. EVENTS (World Revivals)
CREATE TABLE IF NOT EXISTS events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  event_time   TIMESTAMPTZ NOT NULL,
  joined_count INTEGER DEFAULT 0,
  total_slots  INTEGER DEFAULT 100,
  is_featured  BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Simple Public Access Policies (Development/MVP)
CREATE POLICY "Public full access servers" ON servers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access server_players" ON server_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access quick_messages" ON quick_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access session_players" ON session_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access events" ON events FOR ALL USING (true) WITH CHECK (true);

-- 7. REALTIME ENABLEMENT
-- Add tables to the realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    servers, 
    server_players, 
    quick_messages, 
    sessions, 
    session_players, 
    events;
COMMIT;

-- 8. AUTO-CLEANUP FUNCTION (Optional but recommended)
-- Deletes chat messages older than 24h
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM quick_messages WHERE created_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_old_messages ON quick_messages;
CREATE TRIGGER cleanup_old_messages
  AFTER INSERT ON quick_messages
  EXECUTE PROCEDURE delete_old_messages();

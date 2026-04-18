/**
 * Run this ONCE in your Supabase SQL Editor to add quick_messages support:
 *
 * Copy-paste the SQL below into:
 * Supabase Dashboard → SQL Editor → New query → Paste → Run
 */

const SQL = `
-- Quick messages table for in-lobby chat
CREATE TABLE IF NOT EXISTS quick_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id   UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  temp_user_id TEXT NOT NULL,
  username    TEXT NOT NULL,
  text        TEXT NOT NULL CHECK (char_length(text) <= 200),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security (allow all reads/inserts without login)
ALTER TABLE quick_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read quick_messages"
  ON quick_messages FOR SELECT USING (true);

CREATE POLICY "Public insert quick_messages"
  ON quick_messages FOR INSERT WITH CHECK (true);

-- Auto-delete messages older than 24h to keep the table lean
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

-- Enable realtime for quick_messages
ALTER PUBLICATION supabase_realtime ADD TABLE quick_messages;
`;

console.log("=== Run the following SQL in your Supabase SQL Editor ===");
console.log(SQL);
console.log("=========================================================");

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL cluster.');

    // 1. Create live_queue table
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_queue (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        temp_user_id UUID NOT NULL,
        username VARCHAR(255) NOT NULL,
        game VARCHAR(255) NOT NULL,
        tags TEXT[] DEFAULT '{}',
        discord_id VARCHAR(255),
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created live_queue table.');

    // Enable realtime for live_queue
    try {
        await client.query(`
          alter publication supabase_realtime add table live_queue;
        `);
        console.log('Enabled realtime for live_queue.');
    } catch(e) {
        console.log('Realtime already enabled or failed to enable:', e.message);
    }
    

    // 2. Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        game VARCHAR(255) NOT NULL,
        time TIMESTAMP WITH TIME ZONE NOT NULL,
        max_players INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created sessions table.');

    // 3. Create session_players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_players (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        temp_user_id UUID NOT NULL,
        username VARCHAR(255) NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created session_players table.');

    // 4. Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        game VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        total_slots INT NOT NULL,
        joined_count INT DEFAULT 0,
        event_time TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created events table.');

    // Populate events with a sample event
    await client.query(`
        INSERT INTO events (game, title, total_slots, joined_count, event_time)
        SELECT 'Minecraft', 'Ender Dragon Rush', 50, 12, NOW() + INTERVAL '2 days'
        WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Ender Dragon Rush');
    `);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();

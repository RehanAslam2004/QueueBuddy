require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({ connectionString });

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL.');

    // 1. Create servers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS servers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        host_id UUID NOT NULL,
        game VARCHAR(255) NOT NULL,
        max_players INT DEFAULT 4,
        tags TEXT[] DEFAULT '{}',
        connect_info TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created servers table.');

    // 2. Create server_players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS server_players (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
        temp_user_id UUID NOT NULL,
        username VARCHAR(255) NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(server_id, temp_user_id)
      );
    `);
    console.log('Created server_players table.');

    // 3. Update events table
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log('Updated events table columns.');

    // 4. Update sessions table (ensure notes existed)
    await client.query(`
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_id UUID;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_username VARCHAR(255);
    `);
    console.log('Ensure sessions table has required columns.');

    // 5. Enable Realtime
    try {
        await client.query(`alter publication supabase_realtime add table servers;`);
        await client.query(`alter publication supabase_realtime add table server_players;`);
        console.log('Enabled realtime for servers and server_players.');
    } catch(e) {
        console.log('Realtime already enabled or failed:', e.message);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();

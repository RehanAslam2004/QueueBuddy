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

    // Add mc_username and role to session_players
    await client.query(`
      ALTER TABLE session_players 
      ADD COLUMN IF NOT EXISTS mc_username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS role VARCHAR(255);
    `);
    console.log('Updated session_players schema.');

    // Add mc_username and role to server_players
    await client.query(`
      ALTER TABLE server_players 
      ADD COLUMN IF NOT EXISTS mc_username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS role VARCHAR(255);
    `);
    console.log('Updated server_players schema.');

    // Add mc_username to live_queue
    await client.query(`
      ALTER TABLE live_queue 
      ADD COLUMN IF NOT EXISTS mc_username VARCHAR(255);
    `);
    console.log('Updated live_queue schema.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();

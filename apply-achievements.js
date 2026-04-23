require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

    const sqlPath = path.join(__dirname, 'achievements-loot.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running achievements and loot migration...');
    await client.query(sql);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();

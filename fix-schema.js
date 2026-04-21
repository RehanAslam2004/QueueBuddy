require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({ connectionString });

async function fixSchema() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL.');

    // Add origin_id to servers to support conversion tracking and duplicate prevention
    await client.query(`
        ALTER TABLE servers ADD COLUMN IF NOT EXISTS origin_id UUID UNIQUE;
    `);
    console.log('Added origin_id column (UNIQUE) to servers table.');

    console.log('Schema fix completed successfully.');
  } catch (err) {
    console.error('Error executing schema fix:', err);
  } finally {
    await client.end();
  }
}

fixSchema();

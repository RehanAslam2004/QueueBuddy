require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({ connectionString });

async function inspect() {
  try {
    await client.connect();
    const tables = ['sessions', 'events', 'live_queue'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);
      console.log(`Columns in public.${table}:`, res.rows.map(r => r.column_name).join(', '));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspect();

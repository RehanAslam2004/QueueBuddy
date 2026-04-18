const { Client } = require('pg');
const connectionString = 'postgresql://postgres.zkisxgryloggbnszjxib:Zf0oRACHTYqhttIQ@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

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

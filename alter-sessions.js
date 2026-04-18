const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.zkisxgryloggbnszjxib:Zf0oRACHTYqhttIQ@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => {
  return client.query(`
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_id UUID;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_username VARCHAR(255);
  `);
}).then(() => {
  console.log('Altered sessions table.');
  process.exit(0);
}).catch(console.error);

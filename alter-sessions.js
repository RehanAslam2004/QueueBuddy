require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({ connectionString });

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

import { Client } from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].trim();
  }
}

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const sql = fs.readFileSync('supabase/migrations/0048_suscripciones_mercado_pago.sql', 'utf8');
  await client.query(sql);
  console.log('Migration 0048 applied successfully!');
  await client.end();
}
run().catch(console.error);

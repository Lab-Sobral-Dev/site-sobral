require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node migrations/run.js <arquivo.sql>'); process.exit(1); }
  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  await pool.query(sql);
  console.log('Migration aplicada:', file);
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });

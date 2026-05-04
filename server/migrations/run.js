require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node migrations/run.js <arquivo.sql>'); process.exit(1); }
  const migrationsDir = __dirname;
  const filePath = path.join(migrationsDir, path.basename(file));
  if (!fs.existsSync(filePath)) { console.error('Arquivo não encontrado:', file); process.exit(1); }
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration aplicada:', file);
  } finally {
    await pool.end();
  }
}

run().catch(e => { console.error('Erro:', e); process.exit(1); });

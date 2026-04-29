require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./index');

async function migrate() {
  const client = await pool.connect();
  try {
    // Garante que a tabela de controle existe antes de qualquer coisa
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(200) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) {
        console.log(`  skip  ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations(filename) VALUES($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`  apply ${file}`);
    }
    console.log('Migrações concluídas.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro na migração:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

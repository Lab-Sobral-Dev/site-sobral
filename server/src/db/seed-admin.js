// Cria o primeiro usuário administrador a partir do .env.
// Roda ao fim de toda migração e é idempotente: existindo qualquer usuário,
// não faz nada. É o que liga o painel na primeira subida e depois se cala.
async function seedAdmin(client) {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const hash  = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash) return 'sem-env';

  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM admin_users');
  if (rows[0].n > 0) return 'ja-existe';

  await client.query(
    `INSERT INTO admin_users (email, nome, senha_hash, papel, ativo)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO NOTHING`,
    [email, 'Administrador', hash]
  );
  return 'criado';
}

module.exports = { seedAdmin };

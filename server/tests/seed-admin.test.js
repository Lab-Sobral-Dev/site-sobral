const pool = require('../src/db');
const { seedAdmin } = require('../src/db/seed-admin');

const EMAIL = String(process.env.ADMIN_EMAIL).toLowerCase();

async function limpar() {
  await pool.query('DELETE FROM admin_users');
}

beforeEach(limpar);
afterAll(async () => { await limpar(); });

describe('seedAdmin', () => {
  it('cria o primeiro usuário a partir do .env quando a tabela está vazia', async () => {
    const r = await seedAdmin(pool);
    expect(r).toBe('criado');

    const { rows } = await pool.query('SELECT email, papel, ativo FROM admin_users');
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe(EMAIL);
    expect(rows[0].papel).toBe('admin');
    expect(rows[0].ativo).toBe(true);
  });

  it('é idempotente: rodar de novo não cria um segundo usuário', async () => {
    await seedAdmin(pool);
    const r = await seedAdmin(pool);
    expect(r).toBe('ja-existe');

    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM admin_users');
    expect(rows[0].n).toBe(1);
  });

  it('não cria nada quando faltam as variáveis de ambiente', async () => {
    const email = process.env.ADMIN_EMAIL;
    const hash  = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;
    try {
      const r = await seedAdmin(pool);
      expect(r).toBe('sem-env');
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM admin_users');
      expect(rows[0].n).toBe(0);
    } finally {
      process.env.ADMIN_EMAIL = email;
      process.env.ADMIN_PASSWORD_HASH = hash;
    }
  });

  it('guarda o e-mail em minúsculas', async () => {
    process.env.ADMIN_EMAIL = 'MAIUSCULO@Test.com';
    try {
      await seedAdmin(pool);
      const { rows } = await pool.query('SELECT email FROM admin_users');
      expect(rows[0].email).toBe('maiusculo@test.com');
    } finally {
      process.env.ADMIN_EMAIL = EMAIL;
    }
  });
});

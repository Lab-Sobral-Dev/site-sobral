const pool = require('../src/db');
const { registrar } = require('../src/lib/audit');

const req = (admin) => ({ admin, ip: '10.0.0.1' });

afterAll(async () => {
  await pool.query("DELETE FROM audit_log WHERE entidade_id LIKE 'teste-audit-%'");
});

describe('audit.registrar', () => {
  it('grava uma linha com autor, ação e valores', async () => {
    await registrar(req({ id: null, email: 'quem@test.com' }), {
      acao: 'update',
      entidade: 'product',
      entidade_id: 'teste-audit-1',
      campo: 'name',
      valor_anterior: 'Antes',
      valor_novo: 'Depois',
    });

    const { rows } = await pool.query(
      "SELECT * FROM audit_log WHERE entidade_id = 'teste-audit-1'"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].user_email).toBe('quem@test.com');
    expect(rows[0].acao).toBe('update');
    expect(rows[0].campo).toBe('name');
    expect(rows[0].valor_anterior).toBe('Antes');
    expect(rows[0].valor_novo).toBe('Depois');
    expect(rows[0].ip).toBe('10.0.0.1');
  });

  it('trunca valores acima de 100 KB em vez de gravá-los inteiros', async () => {
    const gigante = 'x'.repeat(110 * 1024);
    await registrar(req({ id: null, email: 'quem@test.com' }), {
      acao: 'update',
      entidade: 'product',
      entidade_id: 'teste-audit-2',
      valor_novo: gigante,
    });

    const { rows } = await pool.query(
      "SELECT valor_novo FROM audit_log WHERE entidade_id = 'teste-audit-2'"
    );
    expect(rows[0].valor_novo).toEqual({ truncado: true, tamanho: gigante.length + 2 });
  });

  it('não lança quando a gravação falha', async () => {
    await expect(
      registrar(req({ id: null, email: 'quem@test.com' }), {
        acao: 'update',
        entidade: 'e'.repeat(200),
        entidade_id: 'teste-audit-3',
      })
    ).resolves.toBeUndefined();
  });

  it('aceita requisição sem autor identificado', async () => {
    await registrar({ ip: null }, {
      acao: 'delete',
      entidade: 'product',
      entidade_id: 'teste-audit-4',
    });
    const { rows } = await pool.query(
      "SELECT user_email, user_id FROM audit_log WHERE entidade_id = 'teste-audit-4'"
    );
    expect(rows[0].user_email).toBe('desconhecido');
    expect(rows[0].user_id).toBeNull();
  });
});

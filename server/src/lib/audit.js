const pool = require('../db');

const LIMITE_BYTES = 100 * 1024;

// Valores muito grandes (um texto longo de CMS, por exemplo) viram um marcador:
// o histórico precisa caber na tabela sem inchar o banco.
function podar(valor) {
  if (valor === undefined) return null;
  const json = JSON.stringify(valor);
  if (json && json.length > LIMITE_BYTES) {
    return { truncado: true, tamanho: json.length };
  }
  return valor;
}

// Registra uma alteração. NUNCA lança: perder uma linha de histórico não pode
// derrubar o salvamento que a originou.
async function registrar(req, dados) {
  try {
    const { acao, entidade, entidade_id = null, campo = null,
            valor_anterior, valor_novo } = dados;

    await pool.query(
      `INSERT INTO audit_log
         (user_id, user_email, acao, entidade, entidade_id, campo,
          valor_anterior, valor_novo, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        req?.admin?.id ?? null,
        req?.admin?.email ?? 'desconhecido',
        acao,
        entidade,
        entidade_id,
        campo,
        JSON.stringify(podar(valor_anterior)),
        JSON.stringify(podar(valor_novo)),
        req?.ip ?? null,
      ]
    );
  } catch (err) {
    console.error('audit.registrar falhou:', err.message);
  }
}

module.exports = { registrar };

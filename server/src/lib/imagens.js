const fs   = require('fs');
const path = require('path');
const pool = require('../db');
const { registrar } = require('./audit');

const TIPOS_PERMITIDOS = ['produtos', 'hero', 'cms'];
// server/src/lib → raiz do repositório
const RAIZ_IMAGENS = path.resolve(__dirname, '..', '..', '..', 'public', 'images');

// Converte a URL pública em caminho absoluto, recusando tudo que escape dos
// diretórios permitidos. Devolve null quando o caminho não é aceitável.
function resolverCaminho(url) {
  if (!url || typeof url !== 'string') return null;

  const limpo = url.trim().split('?')[0].split('#')[0];
  if (!limpo.startsWith('/images/')) return null;

  const relativo = limpo.slice('/images/'.length);
  const tipo = relativo.split('/')[0];
  if (!TIPOS_PERMITIDOS.includes(tipo)) return null;

  const absoluto = path.resolve(RAIZ_IMAGENS, relativo);
  const base = path.resolve(RAIZ_IMAGENS, tipo);

  // Trava contra travessia de diretório: o resultado precisa continuar dentro
  // do diretório do tipo.
  if (absoluto !== base && !absoluto.startsWith(base + path.sep)) return null;

  return absoluto;
}

// Varre TODAS as linhas que podem apontar para uma imagem. A duplicação de
// produto faz duas linhas compartilharem o mesmo arquivo, então não basta
// olhar a linha que acabou de mudar.
async function estaEmUso(url) {
  const { rows } = await pool.query(
    `SELECT
       EXISTS(SELECT 1 FROM products     WHERE image = $1)           AS p_img,
       EXISTS(SELECT 1 FROM products     WHERE gallery @> $2::jsonb) AS p_gal,
       EXISTS(SELECT 1 FROM hero_slides  WHERE image_url = $1)       AS h_img,
       EXISTS(SELECT 1 FROM hero_slides  WHERE layers::text LIKE $3) AS h_lay,
       EXISTS(SELECT 1 FROM page_content WHERE value LIKE $3)        AS c_val`,
    [url, JSON.stringify([url]), `%${url}%`]
  );
  const r = rows[0];
  return r.p_img || r.p_gal || r.h_img || r.h_lay || r.c_val;
}

// Apaga o arquivo SÓ se nada mais o referenciar. Nunca lança: perder a
// limpeza não pode derrubar a operação que a originou.
async function removerSeOrfa(req, url) {
  try {
    const absoluto = resolverCaminho(url);
    if (!absoluto) return 'fora-do-escopo';

    // lstat (não stat): um link simbólico nunca é seguido.
    let st;
    try {
      st = fs.lstatSync(absoluto);
    } catch {
      return 'inexistente';
    }
    if (!st.isFile()) return 'fora-do-escopo';

    if (await estaEmUso(url)) return 'em-uso';

    fs.unlinkSync(absoluto);
    await registrar(req, {
      acao: 'delete', entidade: 'image', entidade_id: url,
      valor_anterior: { bytes: st.size },
    });
    return 'removida';
  } catch (err) {
    console.error('removerSeOrfa falhou:', err.message);
    return 'erro';
  }
}

async function removerVarias(req, urls) {
  const unicas = [...new Set((urls || []).filter(Boolean))];
  for (const url of unicas) {
    await removerSeOrfa(req, url);
  }
}

module.exports = { estaEmUso, removerSeOrfa, removerVarias };

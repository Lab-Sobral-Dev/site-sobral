const jwt  = require('jsonwebtoken');
const pool = require('../src/db');

function makeToken() {
  return jwt.sign(
    { email: process.env.ADMIN_EMAIL },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function createCategory(id = 'test-cat-001') {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  await pool.query(
    `INSERT INTO categories(id, label) VALUES($1, 'Categoria Teste')`,
    [id]
  );
  return id;
}

async function deleteCategory(id = 'test-cat-001') {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

async function createProduct(id = 'test-prod-001', categoryId = 'test-cat-001') {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
  await pool.query(
    `INSERT INTO products(id, name, category_id, ativo) VALUES($1, 'Produto Teste', $2, true)`,
    [id, categoryId]
  );
  return id;
}

async function deleteProduct(id = 'test-prod-001') {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
}

const bcrypt = require('bcryptjs');

async function criarUsuario({ email, papel = 'editor', ativo = true, senha = 'Test@123' }) {
  const hash = bcrypt.hashSync(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO admin_users (email, nome, senha_hash, papel, ativo)
     VALUES (lower($1), 'Usuário Teste', $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET papel = EXCLUDED.papel, ativo = EXCLUDED.ativo, senha_hash = EXCLUDED.senha_hash
     RETURNING id, email`,
    [email, hash, papel, ativo]
  );
  return rows[0];
}

async function removerUsuario(email) {
  await pool.query('DELETE FROM admin_users WHERE lower(email) = lower($1)', [email]);
}

function makeTokenPara(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = {
  makeToken, makeTokenPara, createCategory, deleteCategory,
  createProduct, deleteProduct, criarUsuario, removerUsuario,
};

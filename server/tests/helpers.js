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

module.exports = { makeToken, createCategory, deleteCategory, createProduct, deleteProduct };

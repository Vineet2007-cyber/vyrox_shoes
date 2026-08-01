const { pool } = require('../config/db');

const ProductModel = {
  // Products Table Queries
  async create({ category_id, name, slug, brand = 'Vyrox', price, discount_price, description, image_url, is_featured = false }) {
    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, slug, brand, price, discount_price, description, image_url, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, slug, brand, price, discount_price, description, image_url, is_featured]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows[0]) return null;

    const product = rows[0];
    const [sizes] = await pool.query(
      `SELECT id, size, stock FROM product_sizes WHERE product_id = ? ORDER BY id ASC`,
      [id]
    );
    product.sizes = sizes;
    return product;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [slug]
    );
    if (!rows[0]) return null;

    const product = rows[0];
    const [sizes] = await pool.query(
      `SELECT id, size, stock FROM product_sizes WHERE product_id = ? ORDER BY id ASC`,
      [product.id]
    );
    product.sizes = sizes;
    return product;
  },

  async findByCategory(category) {
    const isNumericId = !isNaN(category) && !isNaN(parseFloat(category));
    const query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${isNumericId ? 'p.category_id = ?' : 'c.slug = ?'}
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.query(query, [category]);
    return rows;
  },

  async search(keyword) {
    const searchTerm = `%${keyword}%`;
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.name LIKE ? 
          OR p.description LIKE ? 
          OR p.brand LIKE ? 
          OR c.name LIKE ?
       ORDER BY p.created_at DESC`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    return rows;
  },

  async update(id, { category_id, name, slug, brand, price, discount_price, description, image_url, is_featured }) {
    const [result] = await pool.query(
      `UPDATE products 
       SET category_id = COALESCE(?, category_id),
           name = COALESCE(?, name),
           slug = COALESCE(?, slug),
           brand = COALESCE(?, brand),
           price = COALESCE(?, price),
           discount_price = COALESCE(?, discount_price),
           description = COALESCE(?, description),
           image_url = COALESCE(?, image_url),
           is_featured = COALESCE(?, is_featured)
       WHERE id = ?`,
      [category_id, name, slug, brand, price, discount_price, description, image_url, is_featured, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = ProductModel;


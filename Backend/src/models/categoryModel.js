const { pool } = require('../config/db');

const CategoryModel = {
  // Categories Table Queries
  async create({ name, slug, description, image_url }) {
    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)`,
      [name, slug, description, image_url]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await pool.query(`SELECT * FROM categories ORDER BY name ASC`);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM categories WHERE id = ?`, [id]);
    return rows[0];
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(`SELECT * FROM categories WHERE slug = ?`, [slug]);
    return rows[0];
  },

  async update(id, { name, slug, description, image_url }) {
    const [result] = await pool.query(
      `UPDATE categories
       SET name = COALESCE(?, name),
           slug = COALESCE(?, slug),
           description = COALESCE(?, description),
           image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [name, slug, description, image_url, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query(`DELETE FROM categories WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = CategoryModel;


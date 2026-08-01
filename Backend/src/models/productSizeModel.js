const { pool } = require('../config/db');

const ProductSizeModel = {
  // Product Sizes Table Queries
  async create({ product_id, size, stock = 0 }) {
    const [result] = await pool.query(
      `INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)`,
      [product_id, size, stock]
    );
    return result.insertId;
  },

  async getByProductId(product_id) {
    const [rows] = await pool.query(
      `SELECT * FROM product_sizes WHERE product_id = ? ORDER BY id ASC`,
      [product_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM product_sizes WHERE id = ?`, [id]);
    return rows[0];
  },

  async updateStock(id, stock) {
    const [result] = await pool.query(`UPDATE product_sizes SET stock = ? WHERE id = ?`, [stock, id]);
    return result.affectedRows > 0;
  },

  async upsertSize({ product_id, size, stock }) {
    const [existing] = await pool.query(
      `SELECT * FROM product_sizes WHERE product_id = ? AND size = ?`,
      [product_id, size]
    );

    if (existing.length > 0) {
      await pool.query(`UPDATE product_sizes SET stock = ? WHERE id = ?`, [stock, existing[0].id]);
      return existing[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)`,
      [product_id, size, stock]
    );
    return result.insertId;
  },

  async deleteSize(id) {
    const [result] = await pool.query(`DELETE FROM product_sizes WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  async deleteByProductId(product_id) {
    const [result] = await pool.query(`DELETE FROM product_sizes WHERE product_id = ?`, [product_id]);
    return result.affectedRows;
  }
};

module.exports = ProductSizeModel;


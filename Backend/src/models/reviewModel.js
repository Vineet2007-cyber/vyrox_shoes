const { pool } = require('../config/db');

const ReviewModel = {
  // Reviews Table Queries
  async create({ user_id, product_id, rating, comment }) {
    const [result] = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)`,
      [user_id, product_id, rating, comment]
    );
    return result.insertId;
  },

  async getByProductId(product_id) {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [product_id]
    );
    return rows;
  },

  async findByUserAndProduct(user_id, product_id) {
    const [rows] = await pool.query(
      `SELECT * FROM reviews WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM reviews WHERE id = ?`, [id]);
    return rows[0];
  },

  async getAverageRating(product_id) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total_reviews, COALESCE(AVG(rating), 0) AS average_rating
       FROM reviews
       WHERE product_id = ?`,
      [product_id]
    );
    return {
      total_reviews: rows[0].total_reviews,
      average_rating: parseFloat(Number(rows[0].average_rating).toFixed(1))
    };
  },

  async update(id, { rating, comment }) {
    const [result] = await pool.query(
      `UPDATE reviews SET rating = COALESCE(?, rating), comment = COALESCE(?, comment) WHERE id = ?`,
      [rating, comment, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query(`DELETE FROM reviews WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = ReviewModel;


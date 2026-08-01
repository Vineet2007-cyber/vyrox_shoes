const { pool } = require('../config/db');

const PaymentModel = {
  // Payments Table Queries
  async create({ order_id, user_id, payment_method = 'card', transaction_id = null, amount, status = 'pending', paid_at = null }) {
    const [result] = await pool.query(
      `INSERT INTO payments (order_id, user_id, payment_method, transaction_id, amount, status, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, payment_method, transaction_id, amount, status, paid_at]
    );
    return result.insertId;
  },

  async findByOrderId(order_id) {
    const [rows] = await pool.query(`SELECT * FROM payments WHERE order_id = ?`, [order_id]);
    return rows[0];
  },

  async findByTransactionId(transaction_id) {
    const [rows] = await pool.query(`SELECT * FROM payments WHERE transaction_id = ?`, [transaction_id]);
    return rows[0];
  },

  async updateStatus(id, status, transaction_id = null, paid_at = new Date()) {
    const [result] = await pool.query(
      `UPDATE payments 
       SET status = ?, 
           transaction_id = COALESCE(?, transaction_id), 
           paid_at = ? 
       WHERE id = ?`,
      [status, transaction_id, paid_at, id]
    );
    return result.affectedRows > 0;
  },

  async updateByOrderId(order_id, { status, transaction_id, payment_method, paid_at = new Date() }) {
    const [result] = await pool.query(
      `UPDATE payments 
       SET status = COALESCE(?, status), 
           transaction_id = COALESCE(?, transaction_id), 
           payment_method = COALESCE(?, payment_method),
           paid_at = ? 
       WHERE order_id = ?`,
      [status, transaction_id, payment_method, paid_at, order_id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = PaymentModel;


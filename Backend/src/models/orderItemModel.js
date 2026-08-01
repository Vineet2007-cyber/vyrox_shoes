const { pool } = require('../config/db');

const OrderItemModel = {
  // Order Items Table Queries
  async create({ order_id, product_id, product_name, size, price, quantity, total_price }) {
    const [result] = await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, size, price, quantity, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, product_id, product_name, size, price, quantity, total_price]
    );
    return result.insertId;
  },

  async getByOrderId(order_id) {
    const [rows] = await pool.query(`SELECT * FROM order_items WHERE order_id = ?`, [order_id]);
    return rows;
  },

  async createMany(items) {
    if (!items || items.length === 0) return [];
    const values = items.map(item => [
      item.order_id,
      item.product_id,
      item.product_name,
      item.size,
      item.price,
      item.quantity,
      item.total_price
    ]);
    const [result] = await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, size, price, quantity, total_price) VALUES ?`,
      [values]
    );
    return result.affectedRows;
  }
};

module.exports = OrderItemModel;


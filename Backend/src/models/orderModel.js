const { pool } = require('../config/db');
const OrderItemModel = require('./orderItemModel');

const OrderModel = {
  // Orders Table Queries
  async create({ user_id, order_number, subtotal, shipping_fee = 0, tax = 0, total_amount, shipping_address, status = 'pending' }) {
    const addressStr = typeof shipping_address === 'object' ? JSON.stringify(shipping_address) : shipping_address;
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, order_number, subtotal, shipping_fee, tax, total_amount, status, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, order_number, subtotal, shipping_fee, tax, total_amount, status, addressStr]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    return rows[0];
  },

  async findByOrderNumber(order_number) {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE order_number = ?`, [order_number]);
    return rows[0];
  },

  async getOrderDetails(id) {
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );
    if (!rows[0]) return null;

    const order = rows[0];
    const items = await OrderItemModel.getByOrderId(id);
    order.items = items;
    return order;
  },

  async getByUserId(user_id) {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
    
    // Attach order items to each order
    for (let order of orders) {
      order.items = await OrderItemModel.getByOrderId(order.id);
    }
    
    return orders;
  },

  async getAllOrders() {
    const [orders] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    for (let order of orders) {
      order.items = await OrderItemModel.getByOrderId(order.id);
    }
    return orders;
  },

  async updateStatus(id, status) {
    const [result] = await pool.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
    return result.affectedRows > 0;
  }
};

module.exports = OrderModel;



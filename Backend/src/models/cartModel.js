const { pool } = require('../config/db');
const CartItemModel = require('./cartItemModel');

const CartModel = {
  // Cart Table Queries
  async findOrCreateByUserId(user_id) {
    let [rows] = await pool.query(`SELECT * FROM cart WHERE user_id = ?`, [user_id]);
    if (rows.length === 0) {
      const [result] = await pool.query(`INSERT INTO cart (user_id) VALUES (?)`, [user_id]);
      return { id: result.insertId, user_id };
    }
    return rows[0];
  },

  async findByUserId(user_id) {
    const [rows] = await pool.query(`SELECT * FROM cart WHERE user_id = ?`, [user_id]);
    return rows[0];
  },

  async getCartWithItems(user_id) {
    const cart = await this.findOrCreateByUserId(user_id);
    const items = await CartItemModel.getItemsByCartId(cart.id);

    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => {
      const itemPrice = item.discount_price !== null && item.discount_price !== undefined 
        ? item.discount_price 
        : item.price;
      return sum + (Number(itemPrice) * item.quantity);
    }, 0);

    return {
      cart_id: cart.id,
      user_id: cart.user_id,
      total_items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      items
    };
  }
};

module.exports = CartModel;


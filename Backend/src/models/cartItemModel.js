const { pool } = require('../config/db');

const CartItemModel = {
  // Cart Items Table Queries
  async addItem({ cart_id, product_id, size_id, size, quantity = 1 }) {
    const [existing] = await pool.query(
      `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?`,
      [cart_id, product_id, size]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + Number(quantity);
      await pool.query(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [newQty, existing[0].id]);
      return existing[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, size_id, size, quantity) VALUES (?, ?, ?, ?, ?)`,
      [cart_id, product_id, size_id || null, size, quantity]
    );
    return result.insertId;
  },

  async getItemsByCartId(cart_id) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name AS product_name, p.slug AS product_slug, p.price, p.discount_price, p.image_url, p.brand
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?
       ORDER BY ci.created_at DESC`,
      [cart_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM cart_items WHERE id = ?`, [id]);
    return rows[0];
  },

  async updateQuantity(id, quantity) {
    const [result] = await pool.query(
      `UPDATE cart_items SET quantity = ? WHERE id = ?`,
      [quantity, id]
    );
    return result.affectedRows > 0;
  },

  async removeItem(id) {
    const [result] = await pool.query(`DELETE FROM cart_items WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  async clearCart(cart_id) {
    await pool.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cart_id]);
  }
};

module.exports = CartItemModel;


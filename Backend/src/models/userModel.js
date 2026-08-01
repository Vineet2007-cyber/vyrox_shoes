const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {
  /**
   * Hashes password and creates a new user in the database
   */
  async create({ name, email, password, phone = null, role = 'user' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone, role]
    );
    return result.insertId;
  },

  /**
   * Compares entered plain text password with hashed password
   */
  async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  },

  /**
   * Finds user by email address
   */
  async findByEmail(email) {
    const [rows] = await pool.query(`SELECT * FROM users WHERE email = ?`, [email]);
    return rows[0];
  },

  /**
   * Finds user by ID (excluding password)
   */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  /**
   * Updates user profile
   */
  async updateProfile(id, { name, phone }) {
    await pool.query(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`,
      [name, phone, id]
    );
    return await this.findById(id);
  },

  /**
   * Gets all users (admin feature)
   */
  async getAll() {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC`
    );
    return rows;
  }
};

module.exports = UserModel;

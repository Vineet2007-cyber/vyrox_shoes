const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token for authenticated user
 * @param {number} id - User ID
 * @returns {string} Signed JWT Token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'vyrox_shoes_default_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

module.exports = generateToken;

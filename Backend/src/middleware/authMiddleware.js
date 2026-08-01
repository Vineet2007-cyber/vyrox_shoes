const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * Middleware to protect routes that require JWT authentication
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header: Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'vyrox_shoes_default_secret_key'
      );

      // Get user from token payload (excluding password)
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        res.status(401);
        throw new Error('User not found with provided token');
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401);
      next(new Error('Not authorized, token failed or expired'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no bearer token provided'));
  }
};

/**
 * Middleware to restrict access to admin users only
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    next(new Error('Not authorized as an admin'));
  }
};

module.exports = { protect, admin };

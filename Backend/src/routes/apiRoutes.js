const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/db');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const reviewRoutes = require('./reviewRoutes');

// @route   GET /api/health
// @desc    Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Vyrox Shoes API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/db-status
// @desc    Database connection status check
router.get('/db-status', async (req, res) => {
  const result = await testConnection();
  if (result.success) {
    res.json({ status: 'connected', ...result });
  } else {
    res.status(503).json({ status: 'disconnected', ...result });
  }
});

// Authentication Routes
router.use('/auth', authRoutes);

// Product Routes
router.use('/products', productRoutes);

// Cart Routes
router.use('/cart', cartRoutes);

// Order Routes
router.use('/orders', orderRoutes);

// Payment Routes
router.use('/payment', paymentRoutes);

// Admin Routes
router.use('/admin', adminRoutes);

// Review Routes
router.use('/reviews', reviewRoutes);

module.exports = router;







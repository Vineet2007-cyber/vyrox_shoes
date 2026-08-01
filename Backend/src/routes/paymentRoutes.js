const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPayment, verifyPayment } = require('../controllers/paymentController');

// All payment routes require authentication
router.use(protect);

// @route   POST /api/payment/create
// @desc    Create a new Razorpay payment order
router.post('/create', createPayment);
router.post('/create-order', createPayment);

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature
router.post('/verify', verifyPayment);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  placeOrder,
  viewOrders,
  viewSingleOrder
} = require('../controllers/orderController');

// Protect all order routes
router.use(protect);

// @route   POST /api/orders
// @desc    Place a new order
router.post('/', placeOrder);

// @route   GET /api/orders
// @desc    View all orders for logged in user
router.get('/', viewOrders);

// @route   GET /api/orders/:id
// @desc    View single order details
router.get('/:id', viewSingleOrder);

module.exports = router;

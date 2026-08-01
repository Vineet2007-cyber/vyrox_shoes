const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(protect);

// @route   GET /api/cart
// @desc    View user cart
router.get('/', getCart);

// @route   POST /api/cart OR /api/cart/add
// @desc    Add item to cart
router.post('/', addToCart);
router.post('/add', addToCart);

// @route   PUT /api/cart/:id OR /api/cart/item/:id
// @desc    Update cart item quantity
router.put('/:id', updateCartItem);
router.put('/item/:id', updateCartItem);

// @route   DELETE /api/cart/clear
// @desc    Clear all items from cart
router.delete('/clear', clearCart);

// @route   DELETE /api/cart/:id OR /api/cart/item/:id
// @desc    Remove item from cart
router.delete('/:id', removeFromCart);
router.delete('/item/:id', removeFromCart);

module.exports = router;

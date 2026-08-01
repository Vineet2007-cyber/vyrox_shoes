const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductSizes,
  addOrUpdateProductSize,
  adminViewOrders,
  updateOrderStatus
} = require('../controllers/adminController');

// All admin routes require authentication and admin role privileges
router.use(protect);
router.use(admin);

// ==========================================
// 1. PRODUCT MANAGEMENT ROUTES
// ==========================================
// @route   POST /api/admin/products
// @desc    Add a new product
router.post('/products', addProduct);

// @route   PUT /api/admin/products/:id
// @desc    Update an existing product
router.put('/products/:id', updateProduct);

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
router.delete('/products/:id', deleteProduct);

// ==========================================
// 2. INVENTORY & SIZES ROUTES
// ==========================================
// @route   PUT /api/admin/inventory/stock
// @desc    Update stock for size_id or (product_id, size)
router.put('/inventory/stock', updateStock);

// @route   GET /api/admin/products/:id/sizes
// @desc    Get sizes for a product
router.get('/products/:id/sizes', getProductSizes);

// @route   POST /api/admin/products/:id/sizes
// @desc    Add or update size variant for a product
router.post('/products/:id/sizes', addOrUpdateProductSize);

// ==========================================
// 3. ORDER MANAGEMENT ROUTES
// ==========================================
// @route   GET /api/admin/orders
// @desc    View all orders across all users
router.get('/orders', adminViewOrders);

// @route   PUT /api/admin/orders/:id/status OR /api/admin/orders/:id
// @desc    Update order status
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id', updateOrderStatus);

module.exports = router;

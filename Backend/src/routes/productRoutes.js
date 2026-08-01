const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');

// @route   GET /api/products
// @desc    Get all products
router.get('/', getAllProducts);

// @route   GET /api/products/search
// @desc    Search products by keyword (q parameter)
router.get('/search', searchProducts);

// @route   GET /api/products/category/:category
// @desc    Get products by category ID or slug
router.get('/category/:category', getProductsByCategory);

// @route   GET /api/products/:id
// @desc    Get product by ID
router.get('/:id', getProductById);

module.exports = router;

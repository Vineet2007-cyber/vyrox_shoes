const ProductModel = require('../models/productModel');

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res, next) => {
  try {
    const products = await ProductModel.getAll();
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get products by category (ID or slug)
 * @route   GET /api/products/category/:category
 * @access  Public
 */
const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const products = await ProductModel.findByCategory(category);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search products by keyword
 * @route   GET /api/products/search
 * @access  Public
 */
const searchProducts = async (req, res, next) => {
  try {
    const keyword = req.query.q || req.query.query || req.query.keyword || '';

    if (!keyword.trim()) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    const products = await ProductModel.search(keyword.trim());

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts
};


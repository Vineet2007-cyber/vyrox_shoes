const ReviewModel = require('../models/reviewModel');
const ProductModel = require('../models/productModel');

/**
 * @desc    Add or update a product review
 * @route   POST /api/reviews OR POST /api/reviews/product/:productId
 * @access  Private
 */
const addReview = async (req, res, next) => {
  try {
    const { product_id, rating, comment } = req.body;
    const targetProductId = product_id || req.params.productId;

    if (!targetProductId) {
      res.status(400);
      throw new Error('Please provide a product_id');
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      res.status(400);
      throw new Error('Please provide a valid rating between 1 and 5');
    }

    // Verify product exists
    const product = await ProductModel.findById(targetProductId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await ReviewModel.findByUserAndProduct(req.user.id, targetProductId);

    if (existingReview) {
      // Update existing review
      await ReviewModel.update(existingReview.id, {
        rating: numRating,
        comment: comment !== undefined ? comment : existingReview.comment
      });

      const updatedReview = await ReviewModel.findById(existingReview.id);
      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });
    }

    // Create new review
    const reviewId = await ReviewModel.create({
      user_id: req.user.id,
      product_id: targetProductId,
      rating: numRating,
      comment: comment || ''
    });

    const newReview = await ReviewModel.findById(reviewId);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: newReview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View reviews for a product
 * @route   GET /api/reviews/product/:productId OR GET /api/reviews?product_id=X
 * @access  Public
 */
const viewReviews = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.query.product_id;

    if (!productId) {
      res.status(400);
      throw new Error('Please specify a product_id');
    }

    const reviews = await ReviewModel.getByProductId(productId);
    const summary = await ReviewModel.getAverageRating(productId);

    res.json({
      success: true,
      summary,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  viewReviews
};

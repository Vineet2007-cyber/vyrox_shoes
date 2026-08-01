const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addReview, viewReviews } = require('../controllers/reviewController');

// @route   GET /api/reviews/product/:productId OR /api/reviews?product_id=X
// @desc    View all reviews for a product
router.get('/product/:productId', viewReviews);
router.get('/', viewReviews);

// @route   POST /api/reviews OR /api/reviews/product/:productId
// @desc    Add or update a review for a product (requires login)
router.post('/product/:productId', protect, addReview);
router.post('/', protect, addReview);

module.exports = router;

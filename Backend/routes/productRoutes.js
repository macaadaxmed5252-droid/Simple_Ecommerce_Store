const express = require('express');
const controller = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.get('/', controller.listProducts);
router.get('/categories', controller.getCategories);
router.get('/:id', controller.getProduct);
router.post('/:id/reviews', protect, controller.addReview);

module.exports = router;

const express = require('express');
const controller = require('../controllers/userController');
const { protect, requireCustomer } = require('../middleware/auth');

// Customer portal API. Admin accounts are rejected here so the two portals never share data.
const router = express.Router();
router.use(protect, requireCustomer);
router.get('/me/overview', controller.overview);
router.get('/me/orders', controller.myOrders);
router.get('/me/wishlist', controller.getWishlist);
router.post('/me/wishlist/:productId', controller.addToWishlist);
router.delete('/me/wishlist/:productId', controller.removeFromWishlist);

module.exports = router;

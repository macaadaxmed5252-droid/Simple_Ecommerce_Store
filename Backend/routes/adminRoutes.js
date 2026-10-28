const express = require('express');
const controller = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

// Admin portal API. Every route requires a signed-in admin; customers receive 403.
const router = express.Router();
router.use(protect, requireAdmin);
router.get('/overview', controller.overview);
router.get('/products', controller.listProducts);
router.post('/products', controller.createProduct);
router.patch('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);
router.get('/orders', controller.listOrders);
router.patch('/orders/:id/status', controller.updateOrderStatus);
router.get('/users', controller.listUsers);
router.patch('/users/:id', controller.updateUser);
router.get('/settings', controller.getSettings);
router.patch('/settings', controller.updateSettings);

module.exports = router;

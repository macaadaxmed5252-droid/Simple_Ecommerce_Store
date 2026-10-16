const express = require('express');
const controller = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);
router.get('/overview', controller.overview);
router.post('/products', controller.createProduct);
router.patch('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);
router.get('/orders', controller.listOrders);
router.patch('/orders/:id/status', controller.updateOrderStatus);
router.get('/users', controller.listUsers);
router.patch('/users/:id', controller.updateUser);

module.exports = router;

const express = require('express');
const controller = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.post('/', controller.createOrder);
router.get('/mine', controller.getMyOrders);
router.get('/:id/receipt', controller.downloadReceipt);
router.get('/:id', controller.getOrder);

module.exports = router;

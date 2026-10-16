const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const avatarUpload = require('../middleware/avatarUpload');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Please try again shortly.' } });

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/logout', controller.logout);
router.get('/me', protect, controller.me);
router.patch('/me', protect, controller.updateMe);
router.post('/me/avatar', protect, avatarUpload, controller.updateAvatar);
router.get('/me/orders', protect, controller.myOrders);

module.exports = router;

const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const ACTIVE_SHIPPING_STATUSES = ['pending', 'processing', 'shipped'];
const WISHLIST_LIMIT = 100;

async function overview(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    const activeShipments = orders.filter((order) => ACTIVE_SHIPPING_STATUSES.includes(order.status));
    res.json({
      stats: {
        ordersPlaced: orders.length,
        totalSpent: orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0),
        activeShipments: activeShipments.length,
        shippingBreakdown: Object.fromEntries(ACTIVE_SHIPPING_STATUSES.map((status) => [status, activeShipments.filter((order) => order.status === status).length])),
        wishlistCount: req.user.wishlist.length
      },
      recentOrders: orders.slice(0, 4)
    });
  } catch (error) { next(error); }
}

async function myOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) { next(error); }
}

async function getWishlist(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ products: user.wishlist.filter(Boolean) });
  } catch (error) { next(error); }
}

async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId) || !(await Product.exists({ _id: productId }))) return res.status(404).json({ message: 'We could not find that product.' });
    if (req.user.wishlist.length >= WISHLIST_LIMIT && !req.user.wishlist.some((id) => String(id) === productId)) {
      return res.status(400).json({ message: `Your wishlist can hold up to ${WISHLIST_LIMIT} pieces.` });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: productId } }, { new: true });
    res.json({ wishlist: user.wishlist.map(String) });
  } catch (error) { next(error); }
}

async function removeFromWishlist(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(404).json({ message: 'We could not find that product.' });
    const user = await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } }, { new: true });
    res.json({ wishlist: user.wishlist.map(String) });
  } catch (error) { next(error); }
}

module.exports = { overview, myOrders, getWishlist, addToWishlist, removeFromWishlist };

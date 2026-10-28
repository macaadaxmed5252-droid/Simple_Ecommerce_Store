const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const StoreSetting = require('../models/StoreSetting');

const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

async function createOrder(req, res, next) {
  const decremented = [];
  try {
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length < 1 || items.length > 25) {
      return res.status(400).json({ message: 'Your cart must contain between 1 and 25 products.' });
    }
    const addressFields = ['name', 'email', 'phone', 'address', 'city', 'region', 'postalCode', 'country'];
    if (!shippingAddress || addressFields.some((field) => typeof shippingAddress[field] !== 'string' || !shippingAddress[field].trim())) {
      return res.status(400).json({ message: 'Please complete every shipping address field.' });
    }
    const normalized = new Map();
    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 20) {
        return res.status(400).json({ message: 'One or more cart items are invalid.' });
      }
      const key = String(item.productId);
      normalized.set(key, (normalized.get(key) || 0) + Number(item.quantity));
    }
    const orderItems = [];
    let subtotal = 0;
    for (const [productId, quantity] of normalized) {
      if (quantity > 20) return res.status(400).json({ message: 'A maximum of 20 of each product can be ordered.' });
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!product) throw Object.assign(new Error('Some items sold out while you were checking out. Refresh your cart and try again.'), { status: 409 });
      decremented.push({ _id: product._id, quantity });
      const original = await Product.findById(product._id).select('price name images');
      if (!original) throw Object.assign(new Error('An item is no longer available.'), { status: 409 });
      subtotal += original.price * quantity;
      orderItems.push({ product: product._id, name: original.name, image: original.images[0], category: product.category, quantity, price: original.price });
    }
    subtotal = money(subtotal);
    const settings = await StoreSetting.current();
    const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const tax = money(subtotal * settings.taxRate);
    const order = await Order.create({
      user: req.user._id, items: orderItems,
      shippingAddress: Object.fromEntries(addressFields.map((field) => [field, shippingAddress[field].trim()])),
      subtotal, tax, shipping, total: money(subtotal + tax + shipping),
      paymentMethod: 'mock-card', paymentStatus: 'paid', status: 'pending'
    });
    res.status(201).json({ order });
  } catch (error) {
    if (decremented.length) await Promise.all(decremented.map(({ _id, quantity }) => Product.updateOne({ _id }, { $inc: { stock: quantity } })));
    next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) { next(error); }
}

async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'You cannot view this order.' });
    res.json({ order });
  } catch (error) { next(error); }
}

async function downloadReceipt(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'You cannot view this order.' });
    const line = (label, value) => `${label.padEnd(19)} ${value}`;
    const lines = [
      'ATELIER  /  ORDER RECEIPT', '',
      line('Order', order.orderNumber), line('Date', new Date(order.createdAt).toISOString().slice(0, 10)),
      line('Status', order.status.toUpperCase()), line('Tracking', order.trackingNumber || 'Not yet assigned'), '',
      'SHIP TO', order.shippingAddress.name, order.shippingAddress.address,
      `${order.shippingAddress.city}, ${order.shippingAddress.region} ${order.shippingAddress.postalCode}`,
      order.shippingAddress.country, '', 'ITEMS',
      ...order.items.map((item) => `${item.quantity} x ${item.name}  (${item.category || 'Other'})  —  $${(item.price * item.quantity).toFixed(2)}`), '',
      line('Subtotal', `$${order.subtotal.toFixed(2)}`), line('Tax', `$${order.tax.toFixed(2)}`),
      line('Shipping', order.shipping ? `$${order.shipping.toFixed(2)}` : 'Complimentary'),
      line('TOTAL', `$${order.total.toFixed(2)}`), '', 'Thank you for choosing Atelier.'
    ];
    res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="${order.orderNumber}-receipt.txt"`, 'Cache-Control': 'no-store' });
    res.send(lines.join('\n'));
  } catch (error) { next(error); }
}

module.exports = { createOrder, getMyOrders, getOrder, downloadReceipt };

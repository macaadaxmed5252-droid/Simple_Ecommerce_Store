const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const StoreSetting = require('../models/StoreSetting');

const ORDER_STATUSES = Order.schema.path('status').enumValues;

function makeSlug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function overview(_req, res, next) {
  try {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - 11);
    start.setUTCHours(0, 0, 0, 0);
    const settings = await StoreSetting.current();
    const lowStockFilter = { stock: { $lte: settings.lowStockThreshold } };
    const [products, orders, customers, lowStock, revenue, monthly, categories, statusRows, lowStockProducts, recentOrders] = await Promise.all([
      Product.countDocuments(), Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(lowStockFilter),
      Order.aggregate([{ $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start }, paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, revenue: { $sum: '$total' }, sales: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } }, { $unwind: '$items' },
        { $group: { _id: { $ifNull: ['$items.category', 'Other'] }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { quantity: -1 } }, { $limit: 8 }
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.find(lowStockFilter).sort({ stock: 1, name: 1 }).limit(6).select('name category stock images').lean(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').select('orderNumber total status createdAt user shippingAddress.name')
    ]);
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(start);
      date.setUTCMonth(start.getUTCMonth() + index);
      const key = date.toISOString().slice(0, 7);
      const entry = monthly.find((row) => row._id === key);
      return { month: key, label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), revenue: entry?.revenue || 0, sales: entry?.sales || 0 };
    });
    const statuses = ORDER_STATUSES.map((status) => ({ status, count: statusRows.find((row) => row._id === status)?.count || 0 }));
    res.json({
      stats: { products, orders, customers, lowStock, revenue: revenue[0]?.total || 0, pendingOrders: statuses.find((row) => row.status === 'pending').count },
      analytics: { monthly: months, categories: categories.map((item) => ({ name: item._id || 'Other', quantity: item.quantity, revenue: item.revenue })), statuses },
      lowStockProducts, recentOrders, lowStockThreshold: settings.lowStockThreshold
    });
  } catch (error) { next(error); }
}

async function listProducts(_req, res, next) {
  try {
    const [products, settings] = await Promise.all([Product.find().sort({ updatedAt: -1 }).limit(500), StoreSetting.current()]);
    res.json({ products, lowStockThreshold: settings.lowStockThreshold });
  } catch (error) { next(error); }
}

async function createProduct(req, res, next) {
  try {
    const product = await Product.create({ ...req.body, slug: makeSlug(req.body.slug || req.body.name) });
    res.status(201).json({ product });
  } catch (error) { next(error); }
}

async function updateProduct(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.name && !updates.slug) updates.slug = makeSlug(updates.name);
    if (updates.slug) updates.slug = makeSlug(updates.slug);
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (error) { next(error); }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    await User.updateMany({ wishlist: product._id }, { $pull: { wishlist: product._id } });
    res.json({ message: 'Product removed.' });
  } catch (error) { next(error); }
}

async function listOrders(req, res, next) {
  try {
    // Only accept a known status string, so query objects such as status[$ne]= cannot reach the filter.
    const filter = ORDER_STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
    res.json({ orders });
  } catch (error) { next(error); }
}

async function updateOrderStatus(req, res, next) {
  try {
    if (!ORDER_STATUSES.includes(req.body.status)) return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}.` });
    const current = await Order.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Order not found.' });
    current.status = req.body.status;
    if (req.body.status === 'shipped' && !current.trackingNumber) current.trackingNumber = `ATL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order = await current.save();
    res.json({ order });
  } catch (error) { next(error); }
}

async function listUsers(_req, res, next) {
  try {
    const users = await User.aggregate([
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
      { $project: { name: 1, email: 1, role: 1, status: 1, avatar: 1, createdAt: 1, orderCount: { $size: '$orders' }, spend: { $sum: '$orders.total' } } },
      { $sort: { createdAt: -1 } }, { $limit: 500 }
    ]);
    res.json({ users });
  } catch (error) { next(error); }
}

async function updateUser(req, res, next) {
  try {
    const { role, status } = req.body;
    if (role !== undefined && !['customer', 'admin'].includes(role)) return res.status(400).json({ message: 'Role must be customer or admin.' });
    if (status !== undefined && !['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Status must be active or inactive.' });
    if (String(req.params.id) === String(req.user._id) && (role === 'customer' || status === 'inactive')) {
      return res.status(400).json({ message: 'You cannot remove your own admin access or deactivate your account.' });
    }
    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (error) { next(error); }
}

async function getSettings(_req, res, next) {
  try {
    res.json({ settings: (await StoreSetting.current()).toPublic() });
  } catch (error) { next(error); }
}

async function updateSettings(req, res, next) {
  try {
    const updates = {};
    for (const field of StoreSetting.PUBLIC_FIELDS) {
      if (req.body[field] === undefined) continue;
      if (field === 'storeName' || field === 'supportEmail') {
        if (typeof req.body[field] !== 'string') return res.status(400).json({ message: `${field} must be text.` });
        updates[field] = req.body[field];
      } else {
        const value = Number(req.body[field]);
        if (req.body[field] === '' || !Number.isFinite(value)) return res.status(400).json({ message: `${field} must be a number.` });
        updates[field] = value;
      }
    }
    const settings = await StoreSetting.findOneAndUpdate({ key: 'store' }, { $set: updates }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ settings: settings.toPublic() });
  } catch (error) { next(error); }
}

module.exports = { overview, listProducts, createProduct, updateProduct, deleteProduct, listOrders, updateOrderStatus, listUsers, updateUser, getSettings, updateSettings };

const Product = require('../models/Product');

async function listProducts(req, res, next) {
  try {
    const query = {};
    if (req.query.category && req.query.category !== 'All') query.category = req.query.category;
    if (req.query.search) query.$text = { $search: String(req.query.search).slice(0, 80) };
    const min = Number(req.query.minPrice);
    const max = Number(req.query.maxPrice);
    if (Number.isFinite(min) || Number.isFinite(max)) {
      query.price = {};
      if (Number.isFinite(min)) query.price.$gte = Math.max(0, min);
      if (Number.isFinite(max)) query.price.$lte = Math.max(0, max);
    }
    const sorts = { featured: { featured: -1, createdAt: -1 }, newest: { createdAt: -1 },
      priceAsc: { price: 1 }, priceDesc: { price: -1 }, rating: { createdAt: -1 } };
    const sort = sorts[req.query.sort] || sorts.featured;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(query)
    ]);
    if (req.query.sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

async function getCategories(_req, res, next) {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories: categories.sort() });
  } catch (error) { next(error); }
}

async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'We could not find that product.' });
    res.json({ product });
  } catch (error) { next(error); }
}

async function addReview(req, res, next) {
  try {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'We could not find that product.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 5 || comment.length > 600) {
      return res.status(400).json({ message: 'Choose a rating and write a review between 5 and 600 characters.' });
    }
    const alreadyReviewed = product.reviews.some((review) => String(review.user) === String(req.user._id));
    if (alreadyReviewed) return res.status(409).json({ message: 'You have already reviewed this product.' });
    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    await product.save();
    res.status(201).json({ product });
  } catch (error) { next(error); }
}

module.exports = { listProducts, getCategories, getProduct, addReview };

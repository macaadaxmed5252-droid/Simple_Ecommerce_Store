const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 600 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: [{ type: String, required: true }],
  badge: { type: String, trim: true, maxlength: 30 },
  featured: { type: Boolean, default: false },
  reviews: [reviewSchema]
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.index({ name: 'text', category: 'text', description: 'text' });

productSchema.virtual('rating').get(function averageRating() {
  if (!this.reviews.length) return 0;
  return Number((this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length).toFixed(1));
});

module.exports = mongoose.model('Product', productSchema);

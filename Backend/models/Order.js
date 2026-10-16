const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, default: 'Other' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  address: { type: String, required: true, trim: true, maxlength: 250 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  region: { type: String, required: true, trim: true, maxlength: 80 },
  postalCode: { type: String, required: true, trim: true, maxlength: 20 },
  country: { type: String, required: true, trim: true, maxlength: 80 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: addressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, default: 'mock-card' },
  paymentStatus: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  orderNumber: { type: String, unique: true, index: true },
  trackingNumber: { type: String, default: '' }
}, { timestamps: true });

orderSchema.pre('validate', function createOrderNumber() {
  if (!this.orderNumber) this.orderNumber = `AT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
});

module.exports = mongoose.model('Order', orderSchema);

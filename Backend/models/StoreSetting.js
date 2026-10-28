const mongoose = require('mongoose');

const envNumber = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const PUBLIC_FIELDS = ['storeName', 'supportEmail', 'taxRate', 'shippingFee', 'freeShippingThreshold', 'lowStockThreshold'];

// A single "store" document holds the editable store configuration; env values are the defaults.
const storeSettingSchema = new mongoose.Schema({
  key: { type: String, default: 'store', unique: true },
  storeName: { type: String, trim: true, minlength: 2, maxlength: 60, default: 'Atelier' },
  supportEmail: { type: String, trim: true, lowercase: true, maxlength: 160, default: '', match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  taxRate: { type: Number, min: 0, max: 0.5, default: () => envNumber('TAX_RATE', 0.08) },
  shippingFee: { type: Number, min: 0, max: 1000, default: () => envNumber('SHIPPING_FEE', 8) },
  freeShippingThreshold: { type: Number, min: 0, max: 100000, default: () => envNumber('FREE_SHIPPING_THRESHOLD', 100) },
  lowStockThreshold: { type: Number, min: 0, max: 1000, default: 5, validate: { validator: Number.isInteger, message: 'Low stock threshold must be a whole number.' } }
}, { timestamps: true });

storeSettingSchema.statics.PUBLIC_FIELDS = PUBLIC_FIELDS;

storeSettingSchema.statics.current = async function current() {
  return (await this.findOne({ key: 'store' })) || new this();
};

storeSettingSchema.methods.toPublic = function toPublic() {
  return Object.fromEntries(PUBLIC_FIELDS.map((field) => [field, this[field]]));
};

module.exports = mongoose.model('StoreSetting', storeSettingSchema);

require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const products = [
  { name: 'Forma ceramic vase', slug: 'forma-ceramic-vase', category: 'Home', description: 'A sculptural silhouette for a single stem or a quiet moment on its own. Hand-finished stoneware with a softly tactile glaze.', price: 48, compareAtPrice: 58, stock: 12, badge: 'Bestseller', featured: true, images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Daily ritual cup', slug: 'daily-ritual-cup', category: 'Kitchen', description: 'Your first sip, made a little more special. A balanced, easy-to-hold cup in warm, natural clay.', price: 32, stock: 24, badge: 'New', featured: true, images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Arc desk lamp', slug: 'arc-desk-lamp', category: 'Workspace', description: 'Focused light, softened by thoughtful form. A compact lamp that brings calm to your desk and bedside.', price: 124, stock: 7, badge: 'Limited', featured: true, images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Still linen throw', slug: 'still-linen-throw', category: 'Textiles', description: 'Washed European linen in a generous, layered weave. Beautifully breathable and made to soften with every use.', price: 86, stock: 15, images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Pebble incense holder', slug: 'pebble-incense-holder', category: 'Home', description: 'A small grounding object shaped by river stones. Made from solid wood with a neat brass insert.', price: 26, stock: 31, images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Gather serving bowl', slug: 'gather-serving-bowl', category: 'Kitchen', description: 'Room for the whole table. This generous serving bowl is carved and glazed by hand, so every piece is one of a kind.', price: 68, stock: 9, badge: 'Handmade', images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Everywhere tote', slug: 'everywhere-tote', category: 'Accessories', description: 'A hardworking everyday carryall, cut from heavyweight organic cotton canvas with a considered inside pocket.', price: 38, stock: 40, images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85'] },
  { name: 'Soft glow candle', slug: 'soft-glow-candle', category: 'Home', description: 'A gentle, grounding blend of cedar, fig leaf, and a little late afternoon sun. Poured in a reusable ceramic vessel.', price: 42, stock: 18, badge: 'Made in small batches', images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85'] }
];

async function seed() {
  try {
    await connectDB();
    for (const product of products) {
      await Product.findOneAndUpdate({ slug: product.slug }, { $set: product }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    }
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeThisAdminPassword123!';
    let admin = await User.findOne({ email }).select('+password');
    if (!admin) admin = new User({ name: process.env.ADMIN_NAME || 'Store Admin', email, password, role: 'admin' });
    else {
      admin.name = process.env.ADMIN_NAME || admin.name;
      admin.password = password;
      admin.role = 'admin';
    }
    await admin.save();
    console.log(`Seed complete: ${products.length} products and admin account ${email}`);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();

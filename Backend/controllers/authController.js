const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { normalizeEmail } = require('../middleware/validate');

function issueToken(user, res) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.cookie('storeToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, avatar: user.avatar, createdAt: user.createdAt };
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && Buffer.byteLength(password, 'utf8') <= 72 && /[A-Z]/.test(password)
    && /[a-z]/.test(password) && /\d/.test(password) && /[@$!%*#?&]/.test(password);
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Please enter your name.' });
    if (!normalizeEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
    if (!validPassword(password)) return res.status(400).json({ message: 'Use 8–72 UTF-8 bytes with uppercase, lowercase, a number, and one of @$!%*#?&.' });
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password });
    issueToken(user, res);
    res.status(201).json({ user: safeUser(user) });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!normalizeEmail(email) || typeof password !== 'string') return res.status(400).json({ message: 'Enter a valid email and password.' });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    if (user.status !== 'active') return res.status(403).json({ message: 'This account has been deactivated. Contact the store team for help.' });
    issueToken(user, res);
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}

function logout(_req, res) {
  res.clearCookie('storeToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ message: 'You are signed out.' });
}

async function me(req, res) {
  res.json({ user: safeUser(req.user) });
}

async function updateMe(req, res, next) {
  try {
    const updates = {};
    if (typeof req.body.name === 'string' && req.body.name.trim().length >= 2) updates.name = req.body.name.trim();
    if (typeof req.body.email === 'string' && normalizeEmail(req.body.email)) updates.email = req.body.email.trim().toLowerCase();
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}

async function updateAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose an image to upload.' });
    const signatures = [
      { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
      { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
      { mime: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] }
    ];
    const format = signatures.find((entry) => req.file.mimetype === entry.mime && entry.bytes.every((byte, index) => req.file.buffer[index] === byte));
    if (!format || (format.ext === 'webp' && req.file.buffer.toString('ascii', 8, 12) !== 'WEBP')) {
      return res.status(400).json({ message: 'Upload a valid JPEG, PNG, or WebP image.' });
    }
    const fs = require('fs/promises');
    const path = require('path');
    const crypto = require('crypto');
    const directory = path.join(__dirname, '..', 'storage', 'uploads');
    await fs.mkdir(directory, { recursive: true });
    const filename = `${crypto.randomUUID()}.${format.ext}`;
    await fs.writeFile(path.join(directory, filename), req.file.buffer, { flag: 'wx', mode: 0o644 });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: `/uploads/${filename}` }, { new: true });
    if (req.user.avatar?.startsWith('/uploads/')) {
      await fs.unlink(path.join(directory, path.basename(req.user.avatar))).catch(() => {});
    }
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}

async function myOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) { next(error); }
}

module.exports = { register, login, logout, me, updateMe, updateAvatar, myOrders };

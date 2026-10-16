require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const sanitizeInput = require('./Backend/middleware/sanitizeInput');
const connectDB = require('./Backend/config/db');
const authRoutes = require('./Backend/routes/authRoutes');
const productRoutes = require('./Backend/routes/productRoutes');
const orderRoutes = require('./Backend/routes/orderRoutes');
const adminRoutes = require('./Backend/routes/adminRoutes');
const { notFound, errorHandler } = require('./Backend/middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT) || 4000;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"], baseUri: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"],
    scriptSrc: ["'self'", 'https://fonts.googleapis.com'], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'], imgSrc: ["'self'", 'https:', 'data:'], connectSrc: ["'self'"],
    ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {})
  }
} }));
const allowedOrigins = new Set([process.env.CLIENT_URL || `http://localhost:${port}`]);
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  return callback(Object.assign(new Error('Origin is not allowed by CORS.'), { status: 403 }));
}, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(sanitizeInput);
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', (req, res, next) => {
  const isReadOnly = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const origin = req.get('origin');
  if (!isReadOnly && origin && !allowedOrigins.has(origin)) return res.status(403).json({ message: 'Request origin is not allowed.' });
  next();
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'CodeAlpha Store API' }));
app.get('/api/store-config', (_req, res) => res.json({ settings: {
  taxRate: Number(process.env.TAX_RATE || 0.08),
  shippingFee: Number(process.env.SHIPPING_FEE || 8),
  freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 100)
} }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

app.use(express.static(path.join(__dirname, 'Frontend')));
app.use('/vendor/chart', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist'), { index: false, maxAge: '7d' }));
app.use('/uploads', express.static(path.join(__dirname, 'Backend', 'storage', 'uploads'), { dotfiles: 'deny', index: false, maxAge: '1d', immutable: false }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'Frontend', 'index.html')));
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(port, () => console.log(`\n  Atelier is ready at http://localhost:${port}\n`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Unable to start the store: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;

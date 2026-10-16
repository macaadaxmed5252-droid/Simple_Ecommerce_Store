const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.storeToken || bearer;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid.' });
    if (user.status !== 'active') return res.status(403).json({ message: 'This account has been deactivated. Contact the store team for help.' });
    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}

module.exports = { protect, adminOnly };

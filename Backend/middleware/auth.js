const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Each role lands in its own portal; neither portal renders the other's components.
const PORTAL_HOME = { admin: '/admin/dashboard', customer: '/account/overview' };

function portalHomeFor(role) {
  return PORTAL_HOME[role] || PORTAL_HOME.customer;
}

function readToken(req) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  return req.cookies?.storeToken || bearer;
}

// Resolves the signed-in user or describes why the session is unusable.
async function resolveSession(req) {
  const token = readToken(req);
  if (!token) return { status: 401, message: 'Please sign in to continue.' };
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch (_error) { return { status: 401, message: 'Your session has expired. Please sign in again.' }; }
  const user = await User.findById(decoded.id).select('-password');
  // tokenVersion is bumped by "sign out of all devices", which invalidates every older token.
  if (!user || (decoded.v || 0) !== (user.tokenVersion || 0)) return { status: 401, message: 'Your session is no longer valid.' };
  if (user.status !== 'active') return { status: 403, message: 'This account has been deactivated. Contact the store team for help.' };
  return { user };
}

async function protect(req, res, next) {
  try {
    const session = await resolveSession(req);
    if (!session.user) return res.status(session.status).json({ message: session.message });
    req.user = session.user;
    next();
  } catch (error) { next(error); }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Please sign in to continue.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: roles.includes('admin') ? 'Admin access required.' : 'This area is reserved for customer accounts.', redirectTo: portalHomeFor(req.user.role) });
    }
    next();
  };
}

const requireAdmin = requireRole('admin');
const requireCustomer = requireRole('customer');

// Server-side guard for direct (non-hash) portal URLs such as /admin/products or /account.
// Admins are always sent to the admin portal and customers to the customer portal.
async function portalPageGuard(req, res, next) {
  try {
    const isAdminPage = /^\/admin(\/|$)/.test(req.path);
    const section = /^\/(admin|account|dashboard)\/([a-z-]{1,24})\/?$/.exec(req.path)?.[2];
    const { user } = await resolveSession(req);
    if (!user) return res.redirect(302, '/#/login');
    const home = portalHomeFor(user.role);
    if (isAdminPage !== (user.role === 'admin')) return res.redirect(302, `/#${home}`);
    const base = home.split('/').slice(0, 2).join('/');
    res.redirect(302, section ? `/#${base}/${section}` : `/#${home}`);
  } catch (error) { next(error); }
}

module.exports = { protect, requireRole, requireAdmin, requireCustomer, portalPageGuard, portalHomeFor };

function validate(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === '');
    if (missing.length) return res.status(400).json({ message: `Required fields: ${missing.join(', ')}.` });
    next();
  };
}

function normalizeEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

module.exports = { validate, normalizeEmail };

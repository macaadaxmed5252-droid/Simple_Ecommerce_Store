const sanitizeHtml = require('sanitize-html');

const options = { allowedTags: [], allowedAttributes: {}, disallowedTagsMode: 'discard', enforceHtmlBoundary: true };

function clean(value) {
  if (typeof value === 'string') return sanitizeHtml(value, options).trim();
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
  }
  return value;
}

function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
}

module.exports = sanitizeInput;

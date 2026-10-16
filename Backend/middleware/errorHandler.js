function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let message = error.message || 'Something went wrong.';
  if (error.name === 'CastError') { status = 404; message = 'The requested item was not found.'; }
  if (error.code === 11000) { status = 409; message = 'That email or product slug is already in use.'; }
  if (error.name === 'ValidationError') { status = 400; message = Object.values(error.errors).map((item) => item.message).join(' '); }
  if (error.name === 'MulterError') { status = 400; message = error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 2 MB.' : 'The image could not be uploaded.'; }
  if (status >= 500) console.error(error);
  res.status(status).json({ message, ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: error.stack } : {}) });
}

module.exports = { notFound, errorHandler };

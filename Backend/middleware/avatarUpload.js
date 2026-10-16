const multer = require('multer');

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const accepted = ['image/jpeg', 'image/png', 'image/webp'];
    if (!accepted.includes(file.mimetype)) return callback(Object.assign(new Error('Upload a JPEG, PNG, or WebP image.'), { status: 400 }));
    callback(null, true);
  }
}).single('avatar');

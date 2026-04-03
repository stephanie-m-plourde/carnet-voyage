const multer = require('multer');

const ALLOWED_MIME = /^image\/(jpeg|png|gif|webp|avif|svg\+xml|bmp|tiff)$/;

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'), false);
  }
};

const storage = multer.memoryStorage();

function createUpload(maxFileSize = 15 * 1024 * 1024) {
  return multer({ storage, fileFilter, limits: { fileSize: maxFileSize } });
}

module.exports = createUpload;

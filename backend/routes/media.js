// routes/media.js
const router         = require('express').Router();
const pool           = require('../db');
const auth           = require('../middleware/auth');
const { validateUUID } = require('../middleware/validate');
const sharp          = require('sharp');
const path           = require('path');
const fs             = require('fs');
const createUpload   = require('../middleware/upload');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const upload    = createUpload();

router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM media ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', auth, upload.array('files', 20), async (req, res) => {
  const items = [];
  for (const file of req.files) {
    const filename = `media_${Date.now()}_${Math.random().toString(36).slice(2,6)}.webp`;
    await sharp(file.buffer).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 }).toFile(path.join(uploadDir, filename));
    const url = `/uploads/${filename}`;
    const { rows } = await pool.query(
      'INSERT INTO media (filename, url, mime_type, size_bytes) VALUES ($1,$2,$3,$4) RETURNING *',
      [file.originalname, url, 'image/webp', file.size]
    );
    items.push(rows[0]);
  }
  res.status(201).json(items);
});

router.delete('/:id', auth, validateUUID('id'), async (req, res) => {
  const { rows } = await pool.query('DELETE FROM media WHERE id=$1 RETURNING url', [req.params.id]);
  if (rows[0]) {
    const filepath = path.join(uploadDir, path.basename(rows[0].url));
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }
  res.json({ success: true });
});

module.exports = router;

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

function removeFile(url) {
  if (!url) return;
  const filepath = path.join(uploadDir, path.basename(url));
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}

// GET /api/voyages — liste publique
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM voyages ORDER BY sort_year DESC, sort_month DESC, created_at DESC'
  );
  res.json(rows);
});

// GET /api/voyages/:id
router.get('/:id', validateUUID('id'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM voyages WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Voyage introuvable' });
  res.json(rows[0]);
});

// POST /api/voyages — admin
router.post('/', auth, async (req, res) => {
  const { name, flag, dates, description, sort_year, sort_month } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO voyages (name, flag, dates, description, sort_year, sort_month)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, flag || '', dates || '', description || '', sort_year || 0, sort_month || 0]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/voyages/:id — admin
router.put('/:id', auth, validateUUID('id'), async (req, res) => {
  const { name, flag, dates, description, sort_year, sort_month } = req.body;
  const { rows } = await pool.query(
    `UPDATE voyages SET name=$1, flag=$2, dates=$3, description=$4,
     sort_year=$5, sort_month=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [name, flag || '', dates || '', description || '', sort_year || 0, sort_month || 0, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Voyage introuvable' });
  res.json(rows[0]);
});

// POST /api/voyages/:id/cover — upload photo de couverture
router.post('/:id/cover', auth, validateUUID('id'), upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

  // Supprimer l'ancienne couverture
  const { rows: old } = await pool.query('SELECT cover_url FROM voyages WHERE id=$1', [req.params.id]);
  if (old.length) removeFile(old[0].cover_url);

  const filename = `voyage_${req.params.id}_cover_${Date.now()}.webp`;
  const filepath = path.join(uploadDir, filename);

  await sharp(req.file.buffer)
    .resize(1600, 900, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(filepath);

  const url = `/uploads/${filename}`;
  await pool.query('UPDATE voyages SET cover_url=$1, updated_at=NOW() WHERE id=$2', [url, req.params.id]);
  res.json({ url });
});

// DELETE /api/voyages/:id — admin
router.delete('/:id', auth, validateUUID('id'), async (req, res) => {
  // Récupérer les fichiers à supprimer avant le CASCADE
  const { rows: voyage } = await pool.query('SELECT cover_url FROM voyages WHERE id=$1', [req.params.id]);
  const { rows: artImages } = await pool.query(
    `SELECT ai.url FROM article_images ai
     JOIN articles a ON a.id = ai.article_id
     WHERE a.voyage_id = $1`, [req.params.id]
  );
  const { rows: artCovers } = await pool.query(
    'SELECT cover_url FROM articles WHERE voyage_id=$1 AND cover_url IS NOT NULL', [req.params.id]
  );

  await pool.query('DELETE FROM voyages WHERE id = $1', [req.params.id]);

  // Nettoyage fichiers
  if (voyage.length) removeFile(voyage[0].cover_url);
  artCovers.forEach(r => removeFile(r.cover_url));
  artImages.forEach(r => removeFile(r.url));

  res.json({ success: true });
});

module.exports = router;

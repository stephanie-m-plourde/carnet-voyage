const router         = require('express').Router();
const pool           = require('../db');
const auth           = require('../middleware/auth');
const { validateUUID } = require('../middleware/validate');
const sharp          = require('sharp');
const path           = require('path');
const fs             = require('fs');
const sanitizeHtml   = require('sanitize-html');
const createUpload   = require('../middleware/upload');

const sanitizeBody = (html) => sanitizeHtml(html, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'figure', 'figcaption', 'span', 'div', 'br', 'hr'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'loading', 'class', 'style', 'width', 'height'],
    div: ['class', 'style'],
    span: ['class', 'style'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', '/'],
});

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const upload    = createUpload();

function removeFile(url) {
  if (!url) return;
  const filepath = path.join(uploadDir, path.basename(url));
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}

// GET /api/articles — liste publique (publiés seulement)
router.get('/', async (req, res) => {
  const { voyage_id, status } = req.query;
  let query = `
    SELECT a.*, array_agg(ai.url ORDER BY ai.position) FILTER (WHERE ai.url IS NOT NULL) AS images
    FROM articles a
    LEFT JOIN article_images ai ON ai.article_id = a.id
  `;
  const params = [];
  const conditions = [];

  if (voyage_id) { params.push(voyage_id); conditions.push(`a.voyage_id = $${params.length}`); }
  if (status)    { params.push(status);     conditions.push(`a.status = $${params.length}`); }
  else           { conditions.push(`a.status = 'published'`); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' GROUP BY a.id ORDER BY a.sort_order ASC, a.article_date DESC, a.created_at DESC';

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// GET /api/articles/admin — liste admin (tous statuts)
router.get('/admin', auth, async (req, res) => {
  const { voyage_id } = req.query;
  let query = `
    SELECT a.*, v.name AS voyage_name,
           array_agg(ai.url ORDER BY ai.position) FILTER (WHERE ai.url IS NOT NULL) AS images
    FROM articles a
    LEFT JOIN voyages v ON v.id = a.voyage_id
    LEFT JOIN article_images ai ON ai.article_id = a.id
  `;
  const params = [];
  if (voyage_id) { params.push(voyage_id); query += ` WHERE a.voyage_id = $1`; }
  query += ' GROUP BY a.id, v.name ORDER BY a.sort_order ASC, a.created_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// PUT /api/articles/reorder — admin (must be before /:id)
router.put('/reorder', auth, async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
  for (let i = 0; i < order.length; i++) {
    await pool.query('UPDATE articles SET sort_order=$1, updated_at=NOW() WHERE id=$2', [i, order[i]]);
  }
  res.json({ success: true });
});

// GET /api/articles/:id
router.get('/:id', validateUUID('id'), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT a.*,
           array_agg(ai.url ORDER BY ai.position) FILTER (WHERE ai.url IS NOT NULL) AS images
    FROM articles a
    LEFT JOIN article_images ai ON ai.article_id = a.id
    WHERE a.id = $1
    GROUP BY a.id
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Article introuvable' });
  res.json(rows[0]);
});

// POST /api/articles — admin
router.post('/', auth, async (req, res) => {
  const { voyage_id, title, category, excerpt, body, inline_images, status, article_date } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO articles (voyage_id, title, category, excerpt, body, inline_images, status, article_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [voyage_id, title, category || '', excerpt || '', sanitizeBody(body || ''),
     JSON.stringify(inline_images || {}), status || 'draft', article_date || null]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/articles/:id — admin
router.put('/:id', auth, validateUUID('id'), async (req, res) => {
  const { voyage_id, title, category, excerpt, body, inline_images, status, article_date } = req.body;
  const { rows } = await pool.query(`
    UPDATE articles SET voyage_id=$1, title=$2, category=$3, excerpt=$4, body=$5,
    inline_images=$6, status=$7, article_date=$8, updated_at=NOW()
    WHERE id=$9 RETURNING *`,
    [voyage_id, title, category || '', excerpt || '', sanitizeBody(body || ''),
     JSON.stringify(inline_images || {}), status || 'draft', article_date || null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Article introuvable' });
  res.json(rows[0]);
});

// POST /api/articles/:id/cover — upload couverture
router.post('/:id/cover', auth, validateUUID('id'), upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

  // Supprimer l'ancienne couverture
  const { rows: old } = await pool.query('SELECT cover_url FROM articles WHERE id=$1', [req.params.id]);
  if (old.length) removeFile(old[0].cover_url);

  const filename = `article_${req.params.id}_cover_${Date.now()}.webp`;
  await sharp(req.file.buffer).resize(1600, 900, { fit: 'cover' }).webp({ quality: 85 })
    .toFile(path.join(uploadDir, filename));
  const url = `/uploads/${filename}`;
  await pool.query('UPDATE articles SET cover_url=$1, updated_at=NOW() WHERE id=$2', [url, req.params.id]);
  res.json({ url });
});

// DELETE /api/articles/:id/cover — supprimer couverture
router.delete('/:id/cover', auth, async (req, res) => {
  await pool.query('UPDATE articles SET cover_url=NULL, updated_at=NOW() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// POST /api/articles/:id/images — upload photos galerie
router.post('/:id/images', auth, validateUUID('id'), upload.array('images', 50), async (req, res) => {
  const urls = [];
  for (const file of req.files) {
    const filename = `article_${req.params.id}_img_${Date.now()}_${Math.random().toString(36).slice(2,6)}.webp`;
    await sharp(file.buffer).resize(1200, 900, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 })
      .toFile(path.join(uploadDir, filename));
    const url = `/uploads/${filename}`;
    const pos = urls.length;
    await pool.query(
      'INSERT INTO article_images (article_id, url, position) VALUES ($1,$2,$3)',
      [req.params.id, url, pos]
    );
    urls.push(url);
  }
  res.json({ urls });
});

// DELETE /api/articles/:id/images/:imageId
router.delete('/:id/images/:imageId', auth, validateUUID('id'), async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM article_images WHERE id=$1 AND article_id=$2 RETURNING url',
    [req.params.imageId, req.params.id]
  );
  if (rows.length) removeFile(rows[0].url);
  res.json({ success: true });
});

// DELETE /api/articles/:id/images-by-url — supprimer une image de galerie par URL
router.delete('/:id/images-by-url', auth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  await pool.query('DELETE FROM article_images WHERE url=$1 AND article_id=$2', [url, req.params.id]);
  res.json({ success: true });
});

// PUT /api/articles/:id/images/reorder
router.put('/:id/images/reorder', auth, validateUUID('id'), async (req, res) => {
  const { order } = req.body;
  for (let i = 0; i < order.length; i++) {
    await pool.query('UPDATE article_images SET position=$1 WHERE id=$2 AND article_id=$3',
      [i, order[i], req.params.id]);
  }
  res.json({ success: true });
});

// DELETE /api/articles/:id — admin
router.delete('/:id', auth, validateUUID('id'), async (req, res) => {
  // Récupérer les fichiers à supprimer avant le CASCADE
  const { rows: art } = await pool.query('SELECT cover_url FROM articles WHERE id=$1', [req.params.id]);
  const { rows: images } = await pool.query('SELECT url FROM article_images WHERE article_id=$1', [req.params.id]);

  await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);

  // Nettoyage fichiers
  if (art.length) removeFile(art[0].cover_url);
  images.forEach(r => removeFile(r.url));

  res.json({ success: true });
});

module.exports = router;

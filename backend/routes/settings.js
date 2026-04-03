const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

const ALLOWED_KEYS = new Set([
  'ap-subtitle', 'ap-intro', 'ap-family',
  'ap-b1-title', 'ap-b1-text', 'ap-b2-title', 'ap-b2-text',
  'ap-b3-title', 'ap-b3-text', 'ap-b4-title', 'ap-b4-text',
  'ap-quote', 'ap-quote-attr',
  'formspree-url',
  'contact-eyebrow', 'contact-subtitle', 'contact-card',
  'contact-name-label', 'contact-email-label', 'contact-msg-label',
  'contact-btn-label',
]);

// GET /api/settings — tous les paramètres (public pour À propos)
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

// PUT /api/settings — admin
router.put('/', auth, async (req, res) => {
  const settings = req.body;
  for (const [key, value] of Object.entries(settings)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
      [key, String(value).slice(0, 5000)]
    );
  }
  res.json({ success: true });
});

module.exports = router;

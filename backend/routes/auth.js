const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool   = require('../db');
const auth   = require('../middleware/auth');

// Helper: get hashed password from DB, fallback to env
async function getStoredPassword() {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'admin_password_hash'");
    if (rows.length && rows[0].value) return { hash: rows[0].value, fromDb: true };
  } catch(e) { /* table may not exist yet */ }
  return { hash: null, fromDb: false };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(401).json({ error: 'Mot de passe requis' });

  const stored = await getStoredPassword();

  if (stored.fromDb && stored.hash) {
    // Compare against bcrypt hash in DB
    const valid = await bcrypt.compare(password, stored.hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
  } else {
    // Fallback to env variable (first-time setup)
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const header = req.headers.authorization || '';
  const token  = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ valid: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// PUT /api/auth/password — change password (requires auth + current password)
router.put('/password', auth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  // Verify current password
  const stored = await getStoredPassword();
  if (stored.fromDb && stored.hash) {
    const valid = await bcrypt.compare(current_password, stored.hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  } else {
    if (current_password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }
  }

  // Hash and store new password
  const hash = await bcrypt.hash(new_password, 12);
  await pool.query(
    "INSERT INTO settings (key, value) VALUES ('admin_password_hash', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
    [hash]
  );

  res.json({ success: true, message: 'Mot de passe modifié avec succès' });
});

module.exports = router;

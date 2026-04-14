require('express-async-errors');
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.set('trust proxy', 1);

// Ensure uploads dir exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/voyages',  require('./routes/voyages'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/media',    require('./routes/media'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  // Ne pas exposer les détails internes en production
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Erreur serveur';
  res.status(status).json({ error: message });
});

// Auto-migration: add sort_order column if missing
const pool = require('./db');
(async () => {
  try {
    await pool.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`);
  } catch(e) { console.log('Migration note:', e.message); }
})();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API démarrée sur le port ${PORT}`));

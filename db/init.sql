-- Carnets de voyage · Famille Gagnon
-- Schéma PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Voyages ──────────────────────────────────────────
CREATE TABLE voyages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  flag        VARCHAR(10),
  dates       VARCHAR(100),
  description TEXT,
  cover_url   VARCHAR(500),
  sort_year   INTEGER DEFAULT 0,
  sort_month  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Articles ─────────────────────────────────────────
CREATE TABLE articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id     UUID REFERENCES voyages(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  category      VARCHAR(100),
  excerpt       TEXT,
  body          TEXT,
  inline_images JSONB DEFAULT '{}',
  cover_url     VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published')),
  article_date  DATE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Galerie photos des articles ───────────────────────
CREATE TABLE article_images (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  url        VARCHAR(500) NOT NULL,
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Médiathèque ───────────────────────────────────────
CREATE TABLE media (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename   VARCHAR(300) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  mime_type  VARCHAR(100),
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Paramètres du site (À propos, etc.) ──────────────
CREATE TABLE settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT
);

-- Paramètres par défaut
INSERT INTO settings (key, value) VALUES
  ('ap-subtitle',   '2 adultes, 2 fillettes, 1 conviction : voyager, c''est la meilleure école qui soit.'),
  ('ap-intro',      'Nous sommes convaincus que pour nos enfants, les voyages seront une façon extraordinaire d''apprendre.'),
  ('ap-family',     'Deux adultes qui ont attrapé le virus du voyage bien avant d''avoir des enfants — et qui ont décidé de ne pas s''en guérir.'),
  ('ap-b1-title',   'Notre philosophie'),
  ('ap-b1-text',    'Les voyages ne sont pas des vacances passives. On cherche à comprendre les endroits qu''on visite.'),
  ('ap-b2-title',   'Voyager avec des enfants'),
  ('ap-b2-text',    'Oui, c''est plus compliqué. Oui, ça vaut chaque effort.'),
  ('ap-b3-title',   'Pourquoi ce blog'),
  ('ap-b3-text',    'Pour garder une mémoire vivante de nos aventures.'),
  ('ap-b4-title',   'Nos destinations'),
  ('ap-b4-text',    'Du Costa Rica aux Îles de la Madeleine, du Japon à venir.'),
  ('ap-quote',      'Le voyage est la seule chose qu''on achète qui nous fait grandir.'),
  ('ap-quote-attr', '— Proverbe de famille'),
  ('formspree-url', 'https://formspree.io/f/mreoaldl');

-- Données initiales ──────────────────────────────────
INSERT INTO voyages (id, name, flag, dates, description, cover_url, sort_year, sort_month) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Japon 2026',               'JP', '4 – 25 avril 2026',       'Notre premier grand voyage en Asie — trois semaines à huit, oui, oui, huit, entre temples, montagnes et cerisiers. Nous avons la chance incroyable de voyager avec toute la famille pour un grand total de 6 adultes et 2 enfants!', '/uploads/voyage_japon.webp', 4, 0),
  ('11111111-0000-0000-0000-000000000002', 'Îles-de-la-Madeleine 2025','QC', 'Juin – Juillet 2025',     'Les dunes, le vent, le homard et les plages qui n''en finissent plus.', '/uploads/voyage_madeleine.webp', 0, 0),
  ('11111111-0000-0000-0000-000000000003', 'Péninsule de Bruce 2025',  'ON', 'Août 2025',               'Les eaux turquoise du lac Huron et les sentiers de la Bruce Trail.', '/uploads/voyage_bruce.webp', 0, 0),
  ('11111111-0000-0000-0000-000000000004', 'Guadeloupe 2024',          'GP', 'Avril 2024',              'Entre la Grande-Terre, la Basse-Terre et les Îles Saintes, les plages, les tortues et la forêt tropicale.', '/uploads/voyage_guadeloupe.webp', 0, 0),
  ('11111111-0000-0000-0000-000000000005', 'Indonésie 2024',           'ID', 'Novembre – Décembre 2024','Java, Bali et Nusa Lembongan, les rizières, les temples millénaires et les fonds marins.', '/uploads/voyage_indonesie.webp', 0, 0),
  ('11111111-0000-0000-0000-000000000006', 'Costa Rica 2022',          'CR', 'Mars 2022',               'Notre premier grand voyage en famille. La jungle, les volcans, les singes.', '/uploads/voyage_costarica.webp', 0, 0);

INSERT INTO articles (voyage_id, title, category, excerpt, body, status, article_date, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Arrivée à Tokyo — le choc des contraires', 'Tokyo',
   'Atterrir à Tokyo avec deux fillettes après 14 heures de vol. Les voir sortir du métro de Shinjuku, les yeux grands comme des soucoupes.',
   '<h2>Premier contact</h2><p>On ne dormait plus depuis 20 heures quand le Narita Express nous a déposés à Shinjuku. Tokyo les avait coupé le souffle.</p>',
   'draft', '2026-04-04', 0),
  ('11111111-0000-0000-0000-000000000001', 'Kyoto et les cerisiers en fleur', 'Kyoto',
   'Notre cadette a demandé si on pouvait rester vivre ici, sous les cerisiers. On a failli dire oui.',
   '<h2>Le hanami vu par des enfants</h2><p>Notre cadette a passé une heure à ramasser des pétales tombés et à les remettre sur les branches.</p>',
   'draft', '2026-04-10', 0),
  ('11111111-0000-0000-0000-000000000001', 'Articles à venir', '', '', '', 'published', '2026-04-02', 0),
  ('11111111-0000-0000-0000-000000000002', 'Articles à venir', '', '', '', 'published', '2026-04-02', 0),
  ('11111111-0000-0000-0000-000000000003', 'Articles à venir', '', '', '', 'published', '2026-04-02', 0),
  ('11111111-0000-0000-0000-000000000004', 'Articles à venir', '', '', '', 'published', '2026-04-02', 0),
  ('11111111-0000-0000-0000-000000000005', 'Articles à venir', '', '', '', 'published', '2026-04-02', 0),
  ('11111111-0000-0000-0000-000000000006', 'Articles à venir', '', '', '', 'published', '2026-04-02', 0);

-- Index pour les performances
CREATE INDEX idx_articles_voyage ON articles(voyage_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_article_images_article ON article_images(article_id);
CREATE INDEX idx_voyages_sort ON voyages(sort_year DESC, sort_month DESC);

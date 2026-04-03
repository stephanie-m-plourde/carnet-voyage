# Carnets de voyage · Famille Gagnon

Plateforme de blogue de voyage familial permettant de documenter et partager des voyages à travers le monde. Interface entièrement en français avec gestion de contenu intégrée.

## Fonctionnalités

### Site public

- **Catalogue de voyages** — fiches avec photos de couverture, drapeaux emoji, dates et descriptions
- **Articles de voyage** — contenu riche avec galeries photo, images en ligne et catégorisation
- **Recherche plein texte** — recherche instantanée dans les titres, extraits et corps des articles
- **Page À propos** — présentation de la famille et philosophie de voyage, configurable
- **Formulaire de contact** — intégré via Formspree
- **Thème sombre/clair** — bascule persistante avec transitions fluides
- **Design responsive** — adapté mobile, tablette et bureau

### Administration (protégée par mot de passe)

- **Tableau de bord** — statistiques rapides (voyages, articles, médias)
- **Gestion des voyages** — CRUD complet avec upload de couverture
- **Gestion des articles** — éditeur riche, brouillon/publié, réordonnancement drag-and-drop
- **Galeries photo** — upload multiple, réordonnancement, conversion WebP automatique
- **Médiathèque** — bibliothèque centralisée de fichiers uploadés
- **Éditeur de la page À propos** — modification des textes et configuration du formulaire de contact
- **Sauvegarde automatique** — récupération de brouillon en cas de perte de session

## Stack technique

| Couche           | Technologie                                                    |
|------------------|----------------------------------------------------------------|
| Frontend | SPA vanilla JavaScript, CSS3 avec variables custom (Playfair Display, Lora) |
| Serveur web | Nginx (reverse proxy + SPA routing) |
| Backend | Node.js 20, Express.js 4.18 |
| Base de données | PostgreSQL 16 |
| Authentification | JWT (expiration 7 jours) |
| Upload/Images | Multer + Sharp (conversion WebP automatique) |
| Sécurité | Helmet, express-rate-limit, sanitize-html |
| Déploiement | Docker Compose (3 conteneurs) |

## Architecture

```text
Navigateur (port 3000)
    │
    ▼
  Nginx ──── fichiers statiques (index.html)
    │
    ├── /api/* ────▶ Node.js/Express (port 4000) ──▶ PostgreSQL (port 5432)
    │
    └── /uploads/* ─▶ fichiers média (volume Docker)
```

### Structure du projet

```text
carnet-voyage/
├── docker-compose.yml
├── backup.sh               # Sauvegarde complète (DB + images)
├── restore.sh              # Restauration complète
├── backend/
│   ├── server.js           # Serveur Express, enregistrement des routes
│   ├── db.js               # Pool de connexion PostgreSQL
│   ├── middleware/
│   │   ├── auth.js         # Middleware JWT
│   │   ├── upload.js       # Validation MIME des uploads
│   │   └── validate.js     # Validation UUID des paramètres
│   └── routes/
│       ├── auth.js          # Login et vérification de token
│       ├── voyages.js       # CRUD voyages + couverture
│       ├── articles.js      # CRUD articles, galeries, réordonnancement
│       ├── media.js         # Médiathèque (upload, suppression)
│       └── settings.js      # Paramètres du site (À propos, contact)
├── db/
│   └── init.sql            # Schéma SQL + données de démonstration
├── uploads/                # Photos de couverture initiales (seed)
└── frontend/
    ├── nginx.conf          # Routing SPA + proxy API
    └── index.html          # Application complète (HTML + CSS + JS)
```

### Base de données

5 tables principales : `voyages`, `articles`, `article_images`, `media`, `settings` (clé-valeur). Clés primaires UUID. Données de démonstration incluses (6 voyages, 2 articles).

## Guide de démarrage

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et démarré (icône verte)

### Installation et lancement

```powershell
git clone <url-du-repo>
cd carnet-voyage
cp .env.example .env        # Configurer les secrets dans .env
docker-compose up -d --build
```

Le fichier `.env` contient les mots de passe et secrets du projet. Modifier les valeurs par défaut avant le premier lancement.

La première fois prend 3-5 minutes (téléchargement des images Docker).

### Accès

| URL                                    | Description              |
|----------------------------------------|--------------------------|
| `http://localhost:3000`                | Site public              |
| `http://localhost:3000` (bouton Admin) | Panneau d'administration |

**Mot de passe admin par défaut** : `admin123`

### Changer le mot de passe admin

Dans le fichier `.env`, modifier la variable `ADMIN_PASSWORD`, puis redémarrer :

```powershell
docker-compose down
docker-compose up -d
```

## Commandes utiles

```powershell
docker-compose up -d              # Démarrer
docker-compose down               # Arrêter
docker-compose logs -f            # Voir les logs
docker-compose down && docker-compose up -d --build  # Reconstruire
docker-compose ps                 # État des conteneurs
```

## Sauvegarde et restauration

Les données du site vivent dans deux volumes Docker :

- `postgres_data` — base de données (voyages, articles, paramètres)
- `uploads_data` — images uploadées (couvertures, galeries, médiathèque)

### Sauvegarde complète (DB + images)

```powershell
bash backup.sh
```

Crée un dossier horodaté dans `./backups/` contenant `database.sql` et le dossier `uploads/`.

### Restauration complète

```powershell
bash restore.sh ./backups/backup_2026-04-02_143000
```

### Commandes manuelles

```powershell
# Sauvegarder la base de données seule
docker exec carnets_db pg_dump -U carnets_user carnets_voyage > backup.sql

# Restaurer la base de données
docker exec -i carnets_db psql -U carnets_user carnets_voyage < backup.sql

# Sauvegarder les images uploadées
docker cp carnets_api:/app/uploads ./backup_uploads

# Restaurer les images
docker cp ./backup_uploads/. carnets_api:/app/uploads/
```

## Déploiement en production

Copier le projet sur un serveur VPS (OVH, DigitalOcean, etc.) et lancer `docker-compose up -d`. Pointer un nom de domaine vers l'adresse IP du serveur.

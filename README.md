# Carnets de voyage · Famille Gagnon
## Guide de démarrage

---

## 1. Installer Docker Desktop (Windows)

1. Télécharger sur : https://www.docker.com/products/docker-desktop
2. Lancer l'installateur et suivre les étapes
3. Redémarrer l'ordinateur si demandé
4. Lancer Docker Desktop — attendre que l'icône en bas à droite soit verte

---

## 2. Copier les fichiers du projet

Crée un dossier sur ton ordinateur, par exemple :
```
C:\Projets\carnets-voyage\
```

Copie tout le contenu de cette archive dans ce dossier.
Tu dois avoir cette structure :
```
carnets-voyage/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── voyages.js
│       ├── articles.js
│       ├── media.js
│       └── settings.js
├── db/
│   └── init.sql
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── index.html
```

---

## 3. Démarrer le site

Ouvre **PowerShell** ou **Terminal Windows** et tape :

```powershell
cd C:\Projets\carnets-voyage
docker-compose up -d --build
```

La première fois ça prend 3-5 minutes (téléchargement des images Docker).

---

## 4. Accéder au site

- **Site public** : http://localhost:3000
- **Admin** : bouton Admin en haut à droite
- **Mot de passe admin** : `admin123`

---

## 5. Changer le mot de passe admin

Ouvre `docker-compose.yml` et modifie cette ligne :
```yaml
ADMIN_PASSWORD: admin123
```
Remplace `admin123` par ton mot de passe, puis redémarre :
```powershell
docker-compose down
docker-compose up -d
```

---

## 6. Commandes utiles

```powershell
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer après une modification
docker-compose down && docker-compose up -d --build

# Voir l'état des conteneurs
docker-compose ps
```

---

## 7. Sauvegarde des données

Les données sont dans des volumes Docker. Pour faire une sauvegarde de la base :

```powershell
docker exec carnets_db pg_dump -U carnets_user carnets_voyage > backup.sql
```

Pour restaurer :
```powershell
docker exec -i carnets_db psql -U carnets_user carnets_voyage < backup.sql
```

---

## 8. Mettre le site en ligne (optionnel)

Pour accéder au site depuis l'extérieur, loue un serveur VPS (OVH, DigitalOcean ~6$/mois),
copie ce dossier dessus via SSH, et lance la même commande `docker-compose up -d`.
Pointe ensuite ton nom de domaine vers l'adresse IP du serveur.

---

## Architecture

```
Navigateur → Nginx (port 3000) → API Node.js (port 4000) → PostgreSQL
                                ↓
                          /uploads/ (photos)
```

#!/bin/bash
# ------------------------------------------------------------------
# Sauvegarde complète : base de données + images uploadées
# Usage : bash backup.sh [dossier_destination]
# ------------------------------------------------------------------

set -e

DEST="${1:-./backups}"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="$DEST/backup_$DATE"

mkdir -p "$BACKUP_DIR"

echo "=== Sauvegarde de la base de données ==="
docker exec carnets_db pg_dump -U carnets_user carnets_voyage > "$BACKUP_DIR/database.sql"
echo "    -> $BACKUP_DIR/database.sql"

echo "=== Sauvegarde des images uploadées ==="
docker cp carnets_api:/app/uploads "$BACKUP_DIR/uploads"
echo "    -> $BACKUP_DIR/uploads/"

echo "=== Terminé ==="
echo "Sauvegarde complète dans : $BACKUP_DIR"

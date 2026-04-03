#!/bin/bash
# ------------------------------------------------------------------
# Restauration complète : base de données + images uploadées
# Usage : bash restore.sh <dossier_backup>
# Exemple : bash restore.sh ./backups/backup_2026-04-02_143000
# ------------------------------------------------------------------

set -e

BACKUP_DIR="${1:?Usage: bash restore.sh <dossier_backup>}"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Erreur : le dossier '$BACKUP_DIR' n'existe pas."
    exit 1
fi

if [ -f "$BACKUP_DIR/database.sql" ]; then
    echo "=== Restauration de la base de données ==="
    docker exec -i carnets_db psql -U carnets_user carnets_voyage < "$BACKUP_DIR/database.sql"
    echo "    -> Base de données restaurée"
else
    echo "Avertissement : database.sql introuvable, base de données non restaurée."
fi

if [ -d "$BACKUP_DIR/uploads" ]; then
    echo "=== Restauration des images uploadées ==="
    docker cp "$BACKUP_DIR/uploads/." carnets_api:/app/uploads/
    echo "    -> Images restaurées"
else
    echo "Avertissement : dossier uploads/ introuvable, images non restaurées."
fi

echo "=== Restauration terminée ==="

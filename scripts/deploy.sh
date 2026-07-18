#!/usr/bin/env bash
set -euo pipefail

SRC="/home/aginies/moinsbete"
DEST="/srv/http/moinsbete"

mkdir -p "$DEST"

rsync -a --delete \
  --exclude='dev.db' \
  --exclude='dev.db.bck' \
  --exclude='*.test.ts' \
  --exclude='*.test.tsx' \
  --exclude='vitest.config.ts' \
  --exclude='deploy.sh' \
  --exclude='test.sh' \
  --exclude='check_*.ts' \
  --exclude='debug_*.ts' \
  --exclude='get_sample.ts' \
  --exclude='generate-ideas.ts.bak' \
  --exclude='test_*.ts' \
  --exclude='*.tsbuildinfo' \
  --exclude='.next/cache/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='docs/' \
  "$SRC/" "$DEST/"

# Remove docs if present
rm -rf "$DEST/docs"

# Backup DB avant deploy (dans le répertoire courant)
if [ -f "$DEST/dev.db" ]; then
  BACKUP_NAME="dev.db.bck.$(date +%Y%m%d_%H%M%S)"
  cp "$DEST/dev.db" "$BACKUP_NAME"
  echo "DB backup saved: $BACKUP_NAME"
fi

cd "$DEST"
## Install deps
npm ci

npx prisma generate
npx prisma migrate resolve --applied 20260716163000_add_image_wikimedia_show_categories 2>/dev/null || true
npx prisma migrate deploy
npm run build
pm2 restart moinsbete

echo "Deployed to $DEST"

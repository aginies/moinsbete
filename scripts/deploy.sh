#!/usr/bin/env bash
set -euo pipefail

SRC="/home/aginies/moinsbete"
DEST="/srv/http/moinsbete"
RUN_PRISMA=false
for arg in "$@"; do
  if [ "$arg" = "--prisma" ]; then
    RUN_PRISMA=true
  fi
done

mkdir -p "$DEST"

rsync -a --delete --checksum \
  --exclude='dev.db' \
  --exclude='dev.db.bck' \
  --exclude='*.test.ts' \
  --exclude='*.test.tsx' \
  --exclude='vitest.config.ts' \
  --exclude='deploy.sh' \
  --exclude='test.sh' \
  --exclude='install.sh' \
  --exclude='build.sh' \
  --exclude='check_*.ts' \
  --exclude='debug_*.ts' \
  --exclude='get_sample.ts' \
  --exclude='generate-ideas.ts.bak' \
  --exclude='test_*.ts' \
  --exclude='test_ll*' \
  --exclude='*.tsbuildinfo' \
  --exclude='.next/cache/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='docs/' \
  --include='src/scripts/generate-ideas.ts' \
  --exclude='scripts/*.ts' \
  --exclude='scripts/update' \
  "$SRC/" "$DEST/"

# Remove docs if present
rm -rf "$DEST/docs"

# Remove old DB backups
rm -f "$DEST"/dev.db.bck*

# Remove excluded files that may already exist in DEST
rm -f "$DEST"/scripts/*.ts "$DEST"/scripts/update
rm -f "$DEST"/install.sh "$DEST"/build.sh
rm -f "$DEST"/test_ll*

# Backup DB avant deploy (dans le répertoire courant)
if [ -f "$DEST/dev.db" ]; then
  BACKUP_NAME="dev.db.bck.$(date +%Y%m%d_%H%M%S)"
  cp "$DEST/dev.db" "$BACKUP_NAME"
  echo "DB backup saved: $BACKUP_NAME"
fi

cd "$DEST"
## Install deps
npm ci

if [ "$RUN_PRISMA" = true ]; then
  echo "Running prisma commands..."
  npx prisma generate
  npx prisma migrate resolve --applied 20260716163000_add_image_wikimedia_show_categories 2>/dev/null || true

  # Stop pm2 app to release SQLite lock before migrations
  echo "Stopping moinsbete to avoid SQLite lock..."
  pm2 stop moinsbete 2>/dev/null || true
  sleep 1

  # Retry prisma migrate deploy with timeout (SQLite can be flaky)
  MAX_RETRIES=3
  RETRY=0
  while [ $RETRY -lt $MAX_RETRIES ]; do
    if npx prisma migrate deploy 2>/dev/null; then
      break
    fi
    RETRY=$((RETRY + 1))
    echo "Prisma migrate failed (attempt $RETRY/$MAX_RETRIES), retrying in 2s..."
    sleep 2
  done
fi
npm run build
if [ -f "ecosystem.config.js" ]; then
  echo "Reloading/starting via PM2 ecosystem.config.js..."
  pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
else
  pm2 restart moinsbete
fi

echo "Deployed to $DEST"

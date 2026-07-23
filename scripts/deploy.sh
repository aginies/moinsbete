#!/usr/bin/env bash
set -euo pipefail

SRC="/home/aginies/moinsbete"
DEST="/srv/http/moinsbete"

# Stop PM2 server first to cleanly flush SQLite WAL transactions and release database file locks
echo "Stopping PM2 server..."
pm2 stop moinsbete 2>/dev/null || true

mkdir -p "$DEST"

rsync -a --delete --checksum \
  --exclude='.git/' \
  --exclude='dev.db*' \
  --exclude='data.db*' \
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
  --include='src/scripts/ingest-wikipedia.ts' \
  --include='src/scripts/*.ts' \
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
  BACKUP_SUF="$(date +%Y%m%d_%H%M%S)"
  for f in "$DEST"/dev.db*; do
    if [ -f "$f" ]; then
      cp "$f" "$(basename "$f").bck.$BACKUP_SUF"
    fi
  done
  echo "DB backups saved with suffix: .bck.$BACKUP_SUF"
fi

cd "$DEST"
## Clean and install deps
rm -rf node_modules
npm cache clean --force 2>/dev/null || true
npm install --legacy-peer-deps

# Verify critical dependencies exist
for pkg in next-intl next-pwa next; do
  if [ ! -d "node_modules/$pkg" ]; then
    echo "WARNING: $pkg not found in node_modules, running npm install..."
    npm install
    break
  fi
done
echo "All critical dependencies installed"

# Clear Next.js cache to avoid stale types
rm -rf .next

# Mark legacy migrations as applied
npx prisma migrate resolve --applied 20260716163000_add_image_wikimedia_show_categories 2>/dev/null || true
npx prisma migrate resolve --applied 20260720000001_add_card_order 2>/dev/null || true
npx prisma migrate resolve --applied 20260721190000_add_shared_with_user_to_shared_lobby_bookmark 2>/dev/null || true

# Idempotent: rename bbcNewsCardVisible → newsCardVisible (if column exists)
if [ -f "$DEST/dev.db" ] && command -v sqlite3 &>/dev/null; then
  HAS_OLD_COL=$(sqlite3 "$DEST/dev.db" "PRAGMA table_info(\"User\");" 2>/dev/null | grep -c 'bbcNewsCardVisible' || true)
  HAS_NEW_COL=$(sqlite3 "$DEST/dev.db" "PRAGMA table_info(\"User\");" 2>/dev/null | grep -c 'newsCardVisible' || true)
  if [ "$HAS_OLD_COL" -gt 0 ] && [ "$HAS_NEW_COL" -eq 0 ]; then
    echo "Renaming bbcNewsCardVisible → newsCardVisible..."
    sqlite3 "$DEST/dev.db" 'ALTER TABLE "User" RENAME COLUMN "bbcNewsCardVisible" TO "newsCardVisible";'
  elif [ "$HAS_OLD_COL" -gt 0 ] && [ "$HAS_NEW_COL" -gt 0 ]; then
    echo "Copying bbcNewsCardVisible → newsCardVisible..."
    sqlite3 "$DEST/dev.db" 'UPDATE "User" SET "newsCardVisible" = "bbcNewsCardVisible" WHERE "bbcNewsCardVisible" IS NOT NULL;'
  else
    echo "newsCardVisible column already exists (skip rename)"
  fi
fi

# Always regenerate Prisma client to keep types in sync
echo "Regenerating Prisma client..."
npx prisma generate

# Always apply pending migrations
echo "Applying pending migrations..."
npx prisma migrate deploy

npm run build 2>&1 | tail -20
if [ -f "ecosystem.config.js" ]; then
  echo "Starting/reloading via PM2 ecosystem.config.js..."
  pm2 start ecosystem.config.js || pm2 reload ecosystem.config.js
else
  pm2 start moinsbete || pm2 restart moinsbete
fi

echo "Deployed to $DEST"

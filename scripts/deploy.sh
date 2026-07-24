#!/usr/bin/env bash
set -euo pipefail

DEPLOY_SCRIPT_VERSION="1.3.0"
SRC="/home/aginies/moinsbete"
DEST="/srv/http/moinsbete"

VERSION=$(jq -r '.version' "$SRC/version.json" 2>/dev/null || echo "unknown")
echo "Deploying moinsbete v$VERSION (deploy script v$DEPLOY_SCRIPT_VERSION)..."

# Stop PM2 server first to cleanly flush SQLite WAL transactions and release database file locks
echo "Stopping PM2 server..."
pm2 stop moinsbete 2>/dev/null || true

# Start maintenance page so user sees something during deploy
echo "Starting maintenance page..."
if [ -f "$SRC/scripts/.maintenance.pid" ]; then
  MAINT_PID=$(cat "$SRC/scripts/.maintenance.pid")
  if kill -0 "$MAINT_PID" 2>/dev/null; then
    echo "Maintenance page already running (PID $MAINT_PID), skipping..."
  else
    echo "Stale PID file found, removing..."
    rm -f "$SRC/scripts/.maintenance.pid"
    node "$SRC/scripts/maintenance-server.js" &
    sleep 1
  fi
else
  node "$SRC/scripts/maintenance-server.js" &
  sleep 1
fi

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
  --exclude='scripts/*.ts' \
  --exclude='scripts/update' \
  --include='src/scripts/generate-ideas.ts' \
  --include='src/scripts/ingest-wikipedia.ts' \
  --include='src/scripts/*.ts' \
  "$SRC/" "$DEST/"

# Remove docs if present
rm -rf "$DEST/docs"

# Remove old DB backups
rm -f "$DEST"/dev.db.bck*

# Remove excluded files that may already exist in DEST
rm -f "$DEST"/scripts/*.ts "$DEST"/scripts/update
rm -f "$DEST"/install.sh "$DEST"/build.sh
rm -f "$DEST"/test_ll*

# Backup DB before deploy (in SRC directory)
if [ -f "$DEST/dev.db" ]; then
  BACKUP_DIR="$SRC/backups/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  for f in "$DEST"/dev.db*; do
    if [ -f "$f" ]; then
      cp "$f" "$BACKUP_DIR/"
    fi
  done
  echo "DB backups saved to: $BACKUP_DIR"
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

# Mark legacy migrations as applied (ignore if already applied or not present)
for migration in \
  20260716163000_add_image_wikimedia_show_categories \
  20260720000001_add_card_order \
  20260721190000_add_shared_with_user_to_shared_lobby_bookmark; do
  npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
done

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

echo "Building..."
if ! npm run build 2>&1 | tee /tmp/moinsbete-build.log | tail -20; then
  echo "BUILD FAILED. See /tmp/moinsbete-build.log"
  exit 1
fi
if [ -f "ecosystem.config.js" ]; then
  echo "Starting/reloading via PM2 ecosystem.config.js..."
  pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js
else
  pm2 start moinsbete --update-env || pm2 restart moinsbete
fi
sleep 3
echo "PM2 status:"
pm2 status moinsbete

# Stop maintenance page
echo "Stopping maintenance page..."
if [ -f "$SRC/scripts/.maintenance.pid" ]; then
  kill "$(cat "$SRC/scripts/.maintenance.pid")" 2>/dev/null || true
  rm -f "$SRC/scripts/.maintenance.pid"
fi
sleep 2

echo "Deployed to $DEST"

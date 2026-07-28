#!/usr/bin/env bash
set -euo pipefail

DEPLOY_SCRIPT_VERSION="1.4.0"
SRC="/home/aginies/moinsbete"
DEST="/srv/http/moinsbete"

VERSION=$(jq -r '.version' "$SRC/version.json" 2>/dev/null || echo "unknown")
echo "Deploying moinsbete v$VERSION (deploy script v$DEPLOY_SCRIPT_VERSION)..."

# ─── Helpers ───────────────────────────────────────────────────────────────

log() { echo "[$(date +'%H:%M:%S')] $*"; }

error_exit() { log "ERROR: $1"; exit "${2:-1}"; }

has_command() { command -v "$1" &>/dev/null; }

# ─── Maintenance Page ─────────────────────────────────────────────────────

start_maintenance() {
    log "Starting maintenance page..."
    if [ -f "$SRC/scripts/.maintenance.pid" ]; then
        MAINT_PID=$(cat "$SRC/scripts/.maintenance.pid")
        if kill -0 "$MAINT_PID" 2>/dev/null; then
            log "Maintenance page already running (PID $MAINT_PID), skipping..."
            return
        fi
        log "Stale PID file found, removing..."
        rm -f "$SRC/scripts/.maintenance.pid"
    fi
    node "$SRC/scripts/maintenance-server.js" &
    sleep 1
}

stop_maintenance() {
    log "Stopping maintenance page..."
    if [ -f "$SRC/scripts/.maintenance.pid" ]; then
        kill "$(cat "$SRC/scripts/.maintenance.pid")" 2>/dev/null || true
        rm -f "$SRC/scripts/.maintenance.pid"
    fi
}

trap stop_maintenance EXIT

# ─── Database ──────────────────────────────────────────────────────────────

backup_db() {
    if [ ! -f "$DEST/dev.db" ]; then
        log "No DB to backup, skipping..."
        return
    fi
    BACKUP_DIR="$SRC/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    local count=0
    for f in "$DEST"/dev.db*; do
        [ -f "$f" ] && cp "$f" "$BACKUP_DIR/" && ((count++)) || true
    done
    log "DB backups saved to: $BACKUP_DIR ($count files)"
}

fix_column_rename() {
    [ ! -f "$DEST/dev.db" ] || ! has_command sqlite3 && return 0
    log "Checking bbcNewsCardVisible → newsCardVisible column..."
    local has_old has_new
    has_old=$(sqlite3 "$DEST/dev.db" 'PRAGMA table_info("User");' 2>/dev/null | grep -c 'bbcNewsCardVisible' || true)
    has_new=$(sqlite3 "$DEST/dev.db" 'PRAGMA table_info("User");' 2>/dev/null | grep -c 'newsCardVisible' || true)
    if [ "$has_old" -gt 0 ] && [ "$has_new" -eq 0 ]; then
        log "Renaming bbcNewsCardVisible → newsCardVisible..."
        sqlite3 "$DEST/dev.db" 'ALTER TABLE "User" RENAME COLUMN "bbcNewsCardVisible" TO "newsCardVisible";'
    elif [ "$has_old" -gt 0 ] && [ "$has_new" -gt 0 ]; then
        log "Copying bbcNewsCardVisible → newsCardVisible..."
        sqlite3 "$DEST/dev.db" 'UPDATE "User" SET "newsCardVisible" = "bbcNewsCardVisible" WHERE "bbcNewsCardVisible" IS NOT NULL;'
    else
        log "newsCardVisible column already exists (skip rename)"
    fi
}

add_column_if_missing() {
    local col="$1" table="$2" default="${3:-1}"
    [ ! -f "$DEST/dev.db" ] || ! has_command sqlite3 && return 0
    local count
    count=$(sqlite3 "$DEST/dev.db" "PRAGMA table_info(\"$table\");" 2>/dev/null | grep -c "$col" || true)
    if [ "$count" -eq 0 ]; then
        log "Adding $col column to $table table..."
        sqlite3 "$DEST/dev.db" "ALTER TABLE \"$table\" ADD COLUMN \"$col\" BOOLEAN DEFAULT $default;"
    fi
}

fix_weak_password() {
    [ ! -f "$DEST/dev.db" ] || ! has_command sqlite3 || ! has_command node && return 0
    local hash
    hash=$(sqlite3 "$DEST/dev.db" "SELECT passwordHash FROM User WHERE email='view-only@local';" 2>/dev/null || true)
    if [ "$hash" = "view" ]; then
        log "Fixing weak password for view-only@local..."
        local new_hash
        new_hash=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('view', 12).then(h => console.log(h));" 2>/dev/null)
        sqlite3 "$DEST/dev.db" "UPDATE User SET passwordHash='$new_hash' WHERE email='view-only@local';"
        log "Password hashed."
    fi
}

# ─── Migrations ────────────────────────────────────────────────────────────

resolve_legacy_migrations() {
    log "Resolving legacy migrations..."
    local migrations=(
        20260716163000_add_image_wikimedia_show_categories
        20260720000001_add_card_order
        20260721190000_add_shared_with_user_to_shared_lobby_bookmark
        20260724130000_add_has_seen_splash
        20260725000000_add_wikiloves_topics
        20260725000001_add_pixabay_active_category
    )
    for migration in "${migrations[@]}"; do
        npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
    done
    log "Legacy migrations resolved."
}

apply_pending_migrations() {
    log "Applying pending migrations..."
    if npx prisma migrate deploy 2>/dev/null; then
        log "Migrations applied successfully."
    else
        log "No pending migrations or migrate skipped."
    fi
}

# ─── Dependencies ──────────────────────────────────────────────────────────

install_dependencies() {
    log "Installing dependencies..."
    cd "$DEST"
    rm -rf node_modules
    npm cache clean --force 2>/dev/null || true
    npm install --legacy-peer-deps

    local pkg
    for pkg in next-intl next-pwa next; do
        if [ ! -d "node_modules/$pkg" ]; then
            log "WARNING: $pkg not found, retrying..."
            npm install
            break
        fi
    done
    log "All critical dependencies installed"
}

# ─── Build ─────────────────────────────────────────────────────────────────

run_build() {
    log "Building..."
    rm -rf .next
    if ! npm run build 2>&1 | tee /tmp/moinsbete-build.log | tail -20; then
        error_exit "BUILD FAILED. See /tmp/moinsbete-build.log"
    fi
    log "Build succeeded."
}

# ─── PM2 ───────────────────────────────────────────────────────────────────

start_pm2() {
    log "Starting/reloading via PM2..."
    if [ -f "$DEST/ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js
    else
        pm2 start moinsbete --update-env || pm2 restart moinsbete
    fi
    sleep 3
    log "PM2 status:"
    pm2 status moinsbete
}

# ─── Cleanup ───────────────────────────────────────────────────────────────

cleanup_old_files() {
    log "Cleaning up old files..."
    rm -rf "$DEST/docs"
    rm -f "$DEST"/dev.db.bck*
    rm -f "$DEST"/scripts/*.ts "$DEST"/scripts/update
    rm -f "$DEST"/install.sh "$DEST"/build.sh
    rm -f "$DEST"/test_ll*
}

# ─── Main ──────────────────────────────────────────────────────────────────

log "Stopping PM2 server..."
pm2 stop moinsbete 2>/dev/null || true

start_maintenance
mkdir -p "$DEST"

log "Syncing files via rsync..."
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
  --exclude='/scripts/*.ts' \
  --exclude='/scripts/update' \
  --include='src/scripts/generate-ideas.ts' \
  --include='src/scripts/ingest-wikipedia.ts' \
  --include='src/scripts/*.ts' \
  "$SRC/" "$DEST/"

backup_db
cleanup_old_files

install_dependencies

log "Regenerating Prisma client..."
npx prisma generate

fix_column_rename
add_column_if_missing f1CardVisible User 1
fix_weak_password

resolve_legacy_migrations
apply_pending_migrations

run_build
start_pm2

stop_maintenance
log "Deployed to $DEST"

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
  --exclude='check_*.ts' \
  --exclude='debug_*.ts' \
  --exclude='get_sample.ts' \
  --exclude='generate-ideas.ts.bak' \
  --exclude='test_*.ts' \
  --exclude='*.tsbuildinfo' \
  --exclude='.next/cache/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  "$SRC/" "$DEST/"

cd "$DEST"
npx prisma generate
npm run build
pm2 restart moinsbete

echo "Deployed to $DEST"

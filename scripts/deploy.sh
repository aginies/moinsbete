#!/usr/bin/env bash
set -euo pipefail

SRC="/home/aginies/devel/github/aginies/moinsbete"
DEST="/srv/httpd/moinsbete"

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

cd "$DEST" && npm ci && npx prisma generate

echo "Deployed to $DEST"

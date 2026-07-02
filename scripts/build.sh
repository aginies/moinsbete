#!/bin/bash
# Build StashFru locally

set -e

echo "=== StashFru Build ==="

# 1. Install dependencies
echo "[1/6] Installing dependencies..."
npm install

# 2. Generate Prisma client
echo "[2/6] Generating Prisma client..."
npx prisma generate

# 3. Run database migrations
echo "[3/6] Running database migrations..."
npx prisma migrate dev --name init

# 4. Seed database (manual ideas)
echo "[4/6] Seeding database..."
npx tsx src/scripts/seed-ideas.ts

# 5. Type check
echo "[5/6] Type checking..."
npx tsc --noEmit

# 6. Build
echo "[6/6] Building..."
npm run build

echo ""
echo "=== Build complete! ==="
echo ""
echo "To start dev server: npm run dev"
echo "To start production: npm start"

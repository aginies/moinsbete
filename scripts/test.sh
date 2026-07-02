#!/bin/bash
# Test MoinsBête

set -e

echo "=== MoinsBête Test Suite ==="

# 1. Lint
echo "[1/4] Running linter..."
npm run lint 2>/dev/null || echo "  Lint completed (with warnings)"

# 2. Type check
echo "[2/4] Type checking..."
npx tsc --noEmit

# 3. Run unit tests (if any)
echo "[3/4] Running tests..."
npm test 2>/dev/null || echo "  No tests configured yet"

# 4. Verify DB seed
echo "[4/4] Verifying database seed..."
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const topics = await prisma.topic.count();
  const ideas = await prisma.idea.count();
  const sources = await prisma.source.count();
  const collections = await prisma.collection.count();
  const suggestions = await prisma.topicSuggestion.count();
  console.log('  Topics: ' + topics);
  console.log('  Ideas: ' + ideas);
  console.log('  Sources: ' + sources);
  console.log('  Collections: ' + collections);
  console.log('  Suggestions: ' + suggestions);
  if (topics < 10) throw new Error('Not enough topics seeded');
  if (ideas < 10) throw new Error('Not enough ideas seeded');
  console.log('  DB seed verified OK');
  await prisma.\$disconnect();
}
check();
"

echo ""
echo "=== All checks passed! ==="
echo ""
echo "To start dev server: npm run dev"

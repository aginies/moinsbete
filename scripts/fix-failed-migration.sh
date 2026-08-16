#!/usr/bin/env bash
# Repairs failed Prisma migration on prod DB, then applies pending migrations.
# Usage: bash scripts/fix-failed-migration.sh
set -euo pipefail
cd "$(dirname "$0")/.."

MIG="20260807151635_add_insolite_card"

DB_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' || true)"
DB="${DB_URL#file:}"
[ -n "$DB" ] && [ "$DB" != "file:" ] || DB="dev.db"

if ! command -v sqlite3 >/dev/null; then
  echo "ERROR: sqlite3 not installed" >&2
  exit 1
fi
[ -f "$DB" ] || { echo "ERROR: DB not found: $DB" >&2; exit 1; }

BAK="${DB}.bak.$(date +%Y%m%d-%H%M%S)"
cp "$DB" "$BAK"
echo "Backup created: $BAK"

q() { sqlite3 "$DB" "$1"; }

new_user="$(q "SELECT name FROM sqlite_master WHERE type='table' AND name='new_User';")"
new_wiki="$(q "SELECT name FROM sqlite_master WHERE type='table' AND name='new_CachedWikipediaImage';")"
user_exists="$(q "SELECT name FROM sqlite_master WHERE type='table' AND name='User';")"
wiki_exists="$(q "SELECT name FROM sqlite_master WHERE type='table' AND name='CachedWikipediaImage';")"
user_has_insolite="$(q "SELECT COUNT(*) FROM pragma_table_info('User') WHERE name IN ('insoliteCardVisible','citationCardVisible');")"
wiki_has_language="$(q "SELECT COUNT(*) FROM pragma_table_info('CachedWikipediaImage') WHERE name='language';")"
tables_exist="$(q "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('CachedCitationArticle','CachedInsoliteArticle','PortailLexicalMotDuJour');")"

echo "State: new_User='${new_user}' new_wiki='${new_wiki}' user_insolite_cols=$user_has_insolite wiki_language=$wiki_has_language new_tables=$tables_exist/3"

complete_user_redefine() {
  if [ -n "$new_user" ]; then
    if [ -n "$user_exists" ]; then
      local old_rows new_rows
      old_rows="$(q 'SELECT COUNT(*) FROM "User";')"
      new_rows="$(q 'SELECT COUNT(*) FROM "new_User";')"
      if [ "$new_rows" -lt "$old_rows" ]; then
        echo "ERROR: new_User has $new_rows rows < User $old_rows (incomplete copy). Aborting. Restore from $BAK if needed." >&2
        exit 1
      fi
      q 'DROP TABLE "User";'
    fi
    q 'ALTER TABLE "new_User" RENAME TO "User";'
    echo "User table redefined"
  fi
  q 'CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");'
}

complete_wiki_redefine() {
  if [ -n "$new_wiki" ]; then
    if [ -n "$wiki_exists" ]; then
      local old_rows new_rows
      old_rows="$(q 'SELECT COUNT(*) FROM "CachedWikipediaImage";')"
      new_rows="$(q 'SELECT COUNT(*) FROM "new_CachedWikipediaImage";')"
      if [ "$new_rows" -lt "$old_rows" ]; then
        echo "ERROR: new_CachedWikipediaImage has $new_rows rows < CachedWikipediaImage $old_rows (incomplete copy). Aborting. Restore from $BAK if needed." >&2
        exit 1
      fi
      q 'DROP TABLE "CachedWikipediaImage";'
    fi
    q 'ALTER TABLE "new_CachedWikipediaImage" RENAME TO "CachedWikipediaImage";'
    echo "CachedWikipediaImage table redefined"
  fi
  q 'CREATE INDEX IF NOT EXISTS "CachedWikipediaImage_expiresAt_idx" ON "CachedWikipediaImage"("expiresAt");'
  q 'CREATE INDEX IF NOT EXISTS "CachedWikipediaImage_language_idx" ON "CachedWikipediaImage"("language");'
  q 'CREATE UNIQUE INDEX IF NOT EXISTS "CachedWikipediaImage_imageUrl_date_language_key" ON "CachedWikipediaImage"("imageUrl","date","language");'
}

create_new_tables() {
  q 'CREATE TABLE IF NOT EXISTS "CachedCitationArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "source" TEXT,
    "category" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL,
    "wikiUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
  );'
  q 'CREATE TABLE IF NOT EXISTS "CachedInsoliteArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '"'"''"'"',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT DEFAULT '"'"'général'"'"',
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
  );'
  q 'CREATE TABLE IF NOT EXISTS "PortailLexicalMotDuJour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );'
  q 'CREATE INDEX IF NOT EXISTS "CachedCitationArticle_expiresAt_idx" ON "CachedCitationArticle"("expiresAt");'
  q 'CREATE INDEX IF NOT EXISTS "CachedCitationArticle_category_idx" ON "CachedCitationArticle"("category");'
  q 'CREATE INDEX IF NOT EXISTS "CachedCitationArticle_categoryType_idx" ON "CachedCitationArticle"("categoryType");'
  q 'CREATE UNIQUE INDEX IF NOT EXISTS "CachedCitationArticle_author_text_key" ON "CachedCitationArticle"("author","text");'
  q 'CREATE INDEX IF NOT EXISTS "CachedInsoliteArticle_expiresAt_idx" ON "CachedInsoliteArticle"("expiresAt");'
  q 'CREATE INDEX IF NOT EXISTS "CachedInsoliteArticle_category_idx" ON "CachedInsoliteArticle"("category");'
  q 'CREATE UNIQUE INDEX IF NOT EXISTS "PortailLexicalMotDuJour_date_key" ON "PortailLexicalMotDuJour"("date");'
  q 'CREATE INDEX IF NOT EXISTS "PortailLexicalMotDuJour_date_idx" ON "PortailLexicalMotDuJour"("date");'
  echo "New tables + indexes ensured"
}

failed_rows="$(q "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration_name='$MIG' AND finished_at IS NULL;")"
echo "Failed-state rows for $MIG: $failed_rows"

if [ "$failed_rows" -eq 0 ]; then
  echo "Migration not in failed state, skipping repair"
elif [ -n "$new_user" ] || [ -n "$new_wiki" ]; then
  echo "Case: HALF-APPLIED -> completing manually"
  [ -z "$wiki_exists" ] && [ -z "$new_wiki" ] && { echo "ERROR: CachedWikipediaImage data missing (old dropped, new not created). Aborting. Restore from $BAK if needed." >&2; exit 1; }
  [ -z "$user_exists" ] && [ -z "$new_user" ] && { echo "ERROR: User data missing. Aborting. Restore from $BAK if needed." >&2; exit 1; }
  complete_user_redefine
  complete_wiki_redefine
  create_new_tables
  NOW_MS=$(( $(date +%s) * 1000 ))
  q "UPDATE \"_prisma_migrations\" SET finished_at=$NOW_MS WHERE migration_name='$MIG' AND finished_at IS NULL;"
  echo "Failed row marked as applied"
elif [ "$user_has_insolite" -eq 2 ] && [ "$tables_exist" -eq 3 ] && [ "$wiki_has_language" -eq 1 ]; then
  echo "Case: FULLY APPLIED -> converting failed row to applied"
  NOW_MS=$(( $(date +%s) * 1000 ))
  q "UPDATE \"_prisma_migrations\" SET finished_at=$NOW_MS WHERE migration_name='$MIG' AND finished_at IS NULL;"
elif [ "$user_has_insolite" -eq 0 ] && [ "$tables_exist" -eq 0 ]; then
  echo "Case: NOT APPLIED -> removing failed row so migration re-runs"
  q "DELETE FROM \"_prisma_migrations\" WHERE migration_name='$MIG' AND finished_at IS NULL;"
else
  echo "ERROR: MIXED STATE, cannot auto-fix. State:" >&2
  echo "  new_User='${new_user}' new_wiki='${new_wiki}' user_insolite_cols=$user_has_insolite wiki_language=$wiki_has_language new_tables=$tables_exist/3" >&2
  echo "Inspect DB manually. Backup at: $BAK" >&2
  exit 1
fi

echo "Applying pending migrations..."
npx prisma migrate deploy

echo "Verifying..."
npx prisma migrate status
apod_col="$(q "SELECT COUNT(*) FROM pragma_table_info('User') WHERE name='apodCardVisible';")"
[ "$apod_col" -eq 1 ] || { echo "ERROR: apodCardVisible still missing" >&2; exit 1; }
echo "OK: migration fixed, apodCardVisible present."

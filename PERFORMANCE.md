# Performance Optimizations

## Status

| # | Priority | Issue | File | Status |
|---|----------|-------|------|--------|
| 2 | HIGH | No FTS5 — search degrades with data | `src/app/api/search/route.ts:115` | ⏳ Pending |
| 4 | HIGH | CNRS live scraping blocks response (30s+) | `src/app/api/cnrs-news/route.ts:15` | ⏳ Pending |
| 5 | HIGH | `ioredis` + `redis` both installed | `package.json` | ✅ Done |
| 6 | CRITICAL | SQL injection via `$queryRawUnsafe` | `src/lib/feed-helpers.ts:24,55` | ⏳ Pending |
| 7 | MEDIUM | Missing indexes on `IdeaTopic.topicId`, `ViewedIdea.ideaId` | `prisma/schema.prisma` | ⏳ Pending |
| 8 | MEDIUM | FavorisPageClient: 5 sequential fetches, 10 count states | `favoris-page-client.tsx` | ⏳ Pending |
| 9 | MEDIUM | `BaseImageCard` not memoized | `base-image-card.tsx` | ❌ Skip (low ROI) |
| 10 | MEDIUM | Most images use raw `<img>`, skip Next.js optimization | Multiple card components | ⏳ Pending |
| 11 | MEDIUM | TTL cache unbounded Map growth | `src/lib/ttl-cache.ts` | ✅ Done |
| 12 | MEDIUM | Bookmark toggle = 2 queries (findFirst + create/delete) | `src/lib/favorite.ts` | ❌ Skip (low ROI) |
| 13 | LOW | `router.refresh()` overuse (10 locations) | admin, login, sujets | ⏳ Pending |
| 14 | LOW | Inline date formatting in client component | `admin-content.tsx:510` | ⏳ Pending |

## Details

### 2. No FTS5 — search degrades with data
**File:** `src/app/api/search/route.ts:115`
**Problem:** `contains` = SQLite `LIKE '%q%'` full table scan. Post-filter accent normalization in JS.
**Options:**
- Full FTS5 virtual table (proper ranking, requires raw SQL, Prisma middleware for sync)
- Normalized `searchText` column + prefix `LIKE '...%'` (simpler, index-friendly, 80% benefit)

### 4. CNRS live scraping blocks response
**File:** `src/app/api/cnrs-news/route.ts:15`
**Problem:** Cold cache → scrape up to 10 pages, blocks 30s+
**Fix:** Return placeholder / stale data. Run scraper in background job.

### 5. `ioredis` + `redis` both installed
**File:** `package.json`
**Problem:** Both packages in bundle (~300KB combined)
**Fix:** Pick one, remove other.

### 6. SQL injection via `$queryRawUnsafe`
**File:** `src/lib/feed-helpers.ts:24,55`
**Problem:** Topic IDs interpolated directly into raw SQL
**Fix:** Use `$queryRaw` with `$` parameterized syntax.

### 7. Missing indexes
**File:** `prisma/schema.prisma`
**Missing:**
- `@@index([topicId])` on `IdeaTopic`
- `@@index([ideaId])` on `IdeaTopic`
- `@@index([ideaId])` on `ViewedIdea`

### 8. FavorisPageClient
**File:** `src/app/(main)/favoris/favoris-page-client.tsx`
**Problem:** 5 sequential `useEffect` fetches. 10 count state variables. `searchResults` useMemo rebuilds all tabs on query change.
**Fix:** Single batched fetch. Consolidate count states. Memoize per-tab filtering.

### 9. BaseImageCard not memoized
**File:** `src/components/feed/base-image-card.tsx`
**Fix:** Wrap in `React.memo`

### 10. Images bypass Next.js optimization
**Problem:** Most cards use raw `<img>`. Only 3 `remotePatterns` in `next.config.ts`.
**Fix:** Add patterns for pixabay, wikimedia, radiofrance, cnrs. Convert to `<Image>`.

### 11. TTL cache unbounded growth
**File:** `src/lib/ttl-cache.ts`
**Problem:** `Map` grows without limit. Many unique search keys = memory leak.
**Fix:** Add max-size LRU eviction.

### 12. Bookmark toggle = 2 queries
**File:** `src/lib/favorite.ts:19-42`
**Problem:** `findFirst` then `delete` or `create`
**Fix:** Use `upsert` with unique constraint on `[userId, resourceId]`

### 13. `router.refresh()` overuse
**Problem:** 10 locations. Each triggers full server re-render.
**Fix:** `revalidatePath()` or optimistic updates.

### 14. Inline date formatting in client
**File:** `src/app/admin/admin-content.tsx:510`
**Problem:** `new Date().toLocaleDateString()` in client component → timezone mismatch risk.
**Fix:** Format on server, pass string prop.

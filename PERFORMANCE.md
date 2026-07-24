# DB Performance Issues

## HIGH PRIORITY

### 1. N+1 Query in Lobby Page

**File:** `src/app/lobby/page.tsx`

**Status:** FIXED. Batch fetch all missing ideas before enrichment loop. `enrichBookmark` now sync, uses `ideaMap` lookup instead of per-item query. 0-1 extra queries instead of 0-20.

### 2. Unbounded Queries (no limit/take)

| File | Line | Query | Impact |
|------|------|-------|--------|
| `src/app/api/lobby/route.ts` | 10 | `userSuggestion.findMany({})` | Returns ALL suggestions, no pagination |
| `src/app/api/image-wikimedia/route.ts` | 36 | `userWikimediaTopic.findMany({})` | Returns all on every image request |
| `src/app/admin/page.tsx` | 95 | `user.findMany({})` | Returns all users |
| `src/app/lobby/page.tsx` | 59 | `bookmark.findMany({ userId })` | All bookmarks, no type filter |

**Status:** `src/app/api/lobby/route.ts` and `src/app/lobby/page.tsx` fixed with `take: 100`. Remaining unbounded queries pending.

### 3. Missing Indexes

| Model | Missing Index | Used By |
|-------|---------------|---------|
| `IdeaTopic` | `@@index([topicId])` | Feed/topic filtering, idea detail pages |
| `SharedLobbyBookmark` | `@@index([resourceType, resourceId])` | Lobby resource lookups |
| `ViewedIdea` | `@@index([ideaId])` | History search by title (joins Idea) |

**Status:** `IdeaTopic` index applied (`prisma db push`). Remaining indexes pending.

**Fix:** Add indexes to `prisma/schema.prisma`, run migration.

## MEDIUM PRIORITY

### 4. Redundant Query in Idea Detail Page

**File:** `src/app/(main)/idees/[slug]/page.tsx`

**Status:** FIXED. Extracted `fetchIdeaBySlug` shared function. Both `generateMetadata` and page component use same query. Next.js may cache second call, now explicit.

### 5. Heavy Includes in Lobby Page

**File:** `src/app/lobby/page.tsx:79-136`

3-level deep includes: `sharedLobbyBookmark -> idea -> ideaTopics -> topic + source + user`. Repeated 3 times (sharedBookmarks, sharedWithMe, sharedByMe). Result set explodes with many topics per idea.

**Fix:** Use `select` instead of `include` where possible. Limit fields.

### 6. Unsafe Raw Queries

**File:** `src/lib/feed-helpers.ts:24-64`

String interpolation instead of parameterized queries in `$queryRawUnsafe`. Low risk now (IDs from DB), but unsafe pattern. Recursive CTEs could be precomputed with materialized path column.

**Fix:** Use parameterized queries. Consider materialized path for topic hierarchy.

## LOW PRIORITY

### 7. Multiple Queries for Prev/Next Navigation

**File:** `src/app/(main)/idees/[slug]/page.tsx:80-108`

4 separate queries for prev/next navigation. Could batch with single UNION query.

**Fix:** Single query using UNION or raw SQL.

## Recommended Fix Order

1. Add `take` limits to unbounded queries
2. Batch lobby N+1 query
3. Add missing indexes + migration
4. Fix $queryRawUnsafe parameterization
5. Deduplicate idea detail page query
6. Optimize heavy includes
7. Batch prev/next queries

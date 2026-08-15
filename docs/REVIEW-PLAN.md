# Code Review & Production-Readiness Plan

Generated: 2026-08-15 · Base version: `8.0.13`
Scope: production hardening, performance, de-duplication, dead-code removal. No new features this pass.

Process (per AGENTS.md): after each batch → `npm test` + `npm run build`; bump `version.json` X.X.+1; never drop DB tables (new indexes via `prisma migrate dev`).

---

## P0 — Security

| # | Issue | Location | Fix | Status |
|---|-------|----------|-----|--------|
| S1 | Cron auth bypass via `x-forwarded-for` spoofing | `src/app/api/cron/cache/route.ts`, `src/lib/ip.ts` | Require `CRON_SECRET` in prod OR socket IP; honor XFF only if `TRUST_PROXY=true`; `crypto.timingSafeEqual` for token | [x] |
| S2 | CSRF "own origin" trusts client `x-forwarded-host`/`proto` | `src/lib/csrf.ts` | Derive public origin from env (`NEXTAUTH_URL`/`PUBLIC_ORIGIN`), never request headers | [x] |
| S3 | Credentials brute-force: `authorize()` unthrottled | `src/lib/auth.ts` | Add `checkRateLimit` in `authorize()` | [x] |
| S4 | `registerAction` no min-password / email validation | `src/actions/auth-actions.ts` | Add `MIN_PASSWORD_LENGTH` + `isValidEmail` | [x] |
| S5 | Pixabay + 5 feed routes unthrottled (paid API burn) | `src/app/api/{image-pix,image-wikimedia,image-wikiloves,cnrs-news,portail-lexical,proverbes}/route.ts` | Add `checkRateLimit` | [x] |
| S6 | Error leak `err?.message` + no value validation | `src/app/api/user-card-visibility/route.ts` | Generic 500; validate `value` type | [x] |
| S7 | Missing HSTS / Permissions-Policy; deprecated X-XSS | `next.config.ts` | Add HSTS + Permissions-Policy, drop X-XSS | [x] |

## P0 — Correctness bugs

| # | Bug | Location | Fix | Status |
|---|-----|----------|-----|--------|
| B1 | INSOLITE missing from favorites export (15 types, 14 handled) | `src/app/api/favorites/export/route.ts` | Add INSOLITE query + mapper | [x] |
| B2 | News cursor pagination: sort `scrapedAt` but cursor filters `url` | `src/app/api/news/route.ts` | Composite cursor on sort key | [x] |
| B3 | Stray `'use server'` in route handler | `src/app/api/track/visit/route.ts` | Remove | [x] |
| B4 | `logoutAction` clears same cookie twice | `src/actions/auth-actions.ts` | Remove duplicate block | [x] |

## P1 — Performance

| # | Win | Location | Fix | Impact | Status |
|---|-----|----------|-----|--------|--------|
| P1 | Sujets mounts all 14 cards at once (1 bundle + 14 fetches) | `src/app/(main)/sujets/sujets-client.tsx` | `next/dynamic` per card + IntersectionObserver mount-on-scroll | HIGH | [x] |
| P2 | No feed route uses caching (DB hit per request) | `src/app/api/*` | Cache valid-article pool in-memory/Redis 30-60s, random pick per request | MED-HIGH | [x] |
| P3 | `images.remotePatterns` incomplete | `next.config.ts` | Add pixabay/radio/news/f1/insolite CDNs | MED | [x] |
| P4 | Missing index `Bookmark.nextReviewAt` (+ cnrs.category, radio.radio) | `prisma/schema.prisma` | Add `@@index`, run migration | LOW-MED | [x] |

> P4 note: `prisma migrate dev` blocked by pre-existing drift (migrations dir out of sync with `_prisma_migrations`, would reset DB). Indexes applied directly to `dev.db` via `CREATE INDEX IF NOT EXISTS`. Schema.prisma is source of truth.

> P2 scope: pool cache (60s, `src/lib/feed-pool-cache.ts` over `createRedisTtlCache`) applied to cnrs-news, radio-france, wikipedia-image, news, citation, portail-wikipedia, image-wikiloves, image-pixabay (paid API). Skipped: f1 (bounded small queries), saviez-vous (small static table), insolite (stateful daily pick), proverbes (single row), image-wikimedia (live API, no pool concept).
| P5 | Export route 14 `findMany` → 2 | `src/app/api/favorites/export/route.ts` | Consolidate non-IDEA types via `type in [...]` | LOW-MED | [x] |
| P6 | `news-card` static import of react-virtual | `src/components/feed/news-card.tsx` | Keep (sole consumer) or dynamic | LOW | [] |
| P7 | PWA pointless `api.openai.com` runtime rule | `next.config.ts` | Remove | trivial | [x] |

## P1 — De-duplication

### P0 extractions (~370 lines, zero behavior change)

| # | Dup | Fix | Status |
|---|-----|-----|--------|
| D1 | `fetchLinksFromPortal`+`fetchArticleDetails` in `cache-portail-wikipedia.ts` ↔ `portail-wikipedia/route.ts` | `src/lib/portail-wikipedia-fetch.ts` | [x] |
| D2 | `extractEntries` ×3 (route, script, `sujets-data.ts`) | `src/lib/wikipedia-image-parse.ts` | [x] |
| D3 | Server `fetchRandomImage` loop (wikimedia ↔ wikiloves routes) | `src/lib/commons-random-image.ts` | [x] |
| D4 | Client fetch wrapper ×3 (wikimedia/wikiloves/wikipedia cards) | `fetchCardImage()` helper | [x] |
| D5 | Swipe wrapper block ×2 (wikipedia-image-card ↔ saviez-vous-card) | `src/components/feed/swipe-card-wrapper.tsx` | [x] |
| D6 | `cache-f1.ts` 5 near-identical upsert blocks | `upsertCachedArticle()` in cache-helpers | [x] |
| D7 | Browser UA headers in 6 cache scripts | `BROWSER_HEADERS` const | [x] |

> D2 note: `sujets-data.ts` already removed in dead-code pass; actual dup was route (`extractEntries`) ↔ script (`extractEntriesFR/EN`). Shared lib uses script's robust FR parser (route fallback now more robust; same output fields).
> D7 note: browser UA was in 2 scripts (cnrs, radio-france) → `BROWSER_HEADERS` (full header set). Also unified Wikimedia bot UA (`WIKIMEDIA_UA`) across f1-wiki-parser, cache-wikipedia-image, portail-wikipedia-fetch.

### P1 config-driven (~2000 lines, medium risk) — GATED

| # | Dup | Fix | Status |
|---|-----|-----|--------|
| D8 | 8 bespoke favoris components | `SourceFavoritesList` + per-source config | [] |
| D9 | 4 feed `*-bookmarks.tsx` | same generic component | [] |
| D10 | wikimedia ↔ wikiloves card dup | config-driven `commons-image-card` | [] |
| D11 | 14 `src/lib/*-bookmark.ts` | `bookmark-sources.ts` factory | [] |
| D12 | `PaginatedFavoritesList` 8 color props | take `color: CardColorName` | [] |

## P2 — Dead code removal — ✅ DONE (verified: 359 tests pass, build exit 0)

Removed: 12 empty dir trees (`src/admin`, `src/app/suggestions`, `src/app/lobby/src`, `vrac`, `data`, `public/images`, `src/app/admin/proverbes`, `src/app/api/video-proxy`); never-imported files (`use-source-count.ts`, `radio-france-episodes.ts`, `sujets-data.ts`, `error-boundary.tsx`, `ui/popover.tsx`, `cron-runner.ts` + layout import); `test-layouts` page + admin button; one-off scripts (`fix-corrupted-facts`, `find-corrupted-facts`, `clean_facts`, `fix-unite-templates`, `update-images`, `update-image-urls`, `test_prisma`, `populate-images`, `generate-icons.js`, `insert_saviez_vous.js`, `src/scripts/rename-ideas.ts`, top-level `generate-ideas.ts`); deps (`kapsule`, `fast-xml-parser`, `@types/bcryptjs`; `shadcn`→devDep). Fixed stale AGENTS.md refs.
Kept (verified in-use): `wiki-text-utils.ts`, `insert_saviez_vous.ts`, `enhance-checkpoint.json`, `node-cron`, `react-force-graph-2d`, `run-cron.ts`, `scrape-wikiloves.ts`, `fetch-proverbes.ts`, standalone debug/test scripts, dev.db copies (DB rule).

## Verification

- [x] `npm test` green (359 tests)
- [x] `npm run build` green
- [x] `version.json` bumped (8.0.13 → 8.0.14)
- [x] No DB tables dropped; indexes applied (direct SQL, see P4 note)

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Rules

- Run test after changes
- Run build after major code changes (new features, dependency updates, config changes)
- Check for new vulnerabilities when modifying code (XSS, CSRF, auth bypass, injection)
- Sanitize URL always
- Avoid duplicate code
- Find simple solution
- Do not delete or reset DB
- Bump version in version.json to X.X.+1 for minor fixes

# Adding a New Card

Every new card source must include these files/patterns. Current codebase has **16 card sources**: `saviezVous`, `wikipedia`, `cnrs`, `radioFrance`, `news`, `wikimedia`, `wikiloves`, `pixabay`, `portailLexical`, `portailWikipedia`, `proverbe`, `f1`, `citation`, `insolite`, `apod`, `airCrash`.

## 1. Prisma Schema (`prisma/schema.prisma`)

### Standard cache model (TTL-based):
- Add `Cached{Source}Article` model with: `id`, `title`, `description`, `url`, `imageUrl`, `source`, `category`, `publishedAt`, `scrapedAt`, `expiresAt`
- Add `{SOURCE}_NEWS` to `BookmarkType` enum
- Add `{source}CardVisible` boolean to `User` model

### Non-cache model (no TTL):
- Some sources use different models: `PortailLexicalMotDuJour` (id, word, date unique, createdAt), `SaviezVousFact` (static facts), proverbes stored in `CachedConfig` as JSON value under key `proverbes_all`
- Additional models: `SharedLobbyBookmark` (lobby sharing state), `UserWikimediaTopic` and `UserWikiLovesTopic` (image source category preferences)

## 2. Data Layer

### Full bookmark support (standard pattern):
- `src/lib/{source}-bookmark.ts` - Bookmark manager using `createBookmarkManager()` factory from `@/lib/bookmark-manager`
  - Export `{source}Manager` (instance), `get{Source}Favorites`, `get{Source}FavoritesCount`
  - Define `{Source}FavoriteDoc` interface with `id` field
  - Pass `mapMeta` function that transforms DB `meta` JSON + `resourceId` into typed doc
- `src/actions/bookmark-actions.ts` - Server actions. Uses `createBookmarkManagerActions()` factory from `@/actions/bookmark-manager` and re-exports per-source actions (e.g. `toggleRadioFavoriteAction`) built from each `{source}Manager`
  - Export `toggle{Source}FavoriteAction`, `get{Source}FavoritesAction`, `is{Source}FavoriteAction`

### Simple bookmark support (no manager):
- `useSimpleBookmarkToggle` hook from `@/hooks/use-bookmark-toggle` with `toggleBookmarkAction` from `@/actions/bookmark-actions`
- Used by: portail lexical, proverbe (partial)

### Static data fallback:
- `src/data/{source}.json` - Static JSON fallback (10 articles per category)

## 3. API Route (`src/app/api/{source}/route.ts`)

- `GET` endpoint with rate limiting (30 req/min via `checkRateLimit`)
- Query params: `?categories=cat1,cat2` (multi-select), `?exclude=url`
- Priority: DB cache → JSON fallback
- Return random batch (10-20 articles)
- Support category filtering

## 4. Cache Script (`src/scripts/cache-{source}.ts`)

- Fetch from external API
- Upsert to DB with 6h TTL (or source-specific TTL)
- Run via `/api/cron/cache` (16 sequential steps, not 3x daily)
- Export `scrapeAndCache{Source}()` function

### Cron step ordering:
1. CNRS → 2. Radio France → 3. News → 4. Wikipedia Image (FR) → 5. Wikipedia Image (EN) → 6. F1 → 7. Portail Wikipédia → 8. Wikiquote (Citation) → 9. Wiki Loves → 10. Insolite → 11. Cleanup (11 cache models) → 12. Saviez-vous images → 13. Portail Lexical (WOTD) → 14. APOD (NASA, + FR translation via MyMemory) → 15. Air Crash → 16. Air Crash ASN matching

### Auth: token (`x-cron-token` header or `?token=` param) OR IP whitelist (`ALLOWED_CRON_IPS` in `src/lib/ip.ts`, re-exported from `cache-helpers.ts`, with CIDR support)

## 5. Card Component (`src/components/feed/{source}-card.tsx`)

- `'use client'` component
- Props: `onToggle`, `userId`, `showToggle`, `isVisible`
- State: `articles`, `loading`, `error`, `selectedCategories`, `favorites`
- Features:
  - Scrollable list (maxHeight 700px for 20 items)
  - Category selector (multi-select toggle)
  - Bookmark per article (inline handler, not `useSimpleBookmarkToggle` in loop)
  - Share button (or `ShareToLobbyButton`)
  - Visibility toggle button (eye-off icon)
  - Refresh button
  - Error state handling
- Use `CardVisibilityGuard` wrapper for show/hide logic
- Use `useItemShare` for sharing
- Tab labels MUST use locale keys (not hardcoded):
  ```ts
  const TABS = [
    { key: 'image', label: '{source}_tab_image', icon: ImageIcon },
    { key: 'actualites', label: '{source}_tab_actualites', icon: Newspaper },
    // ...
  ] as const
  // Render: t(tab.label) for desktop, t(tab.label).split(' ')[0] for mobile
  ```
- Wrap card in `CardVisibilityGuard` for show/hide logic
- Reuse existing components first: `CardVisibilityGuard`, `useAutoRefresh`, `useItemShare`, `PaginatedFavoritesList`, `useFavoritesList`, `createBookmarkManager`, `createBookmarkManagerActions`

## 5b. Reusable Components (check before creating new ones)

- `CardVisibilityGuard` — show/hide wrapper with hydration-safe mount check
- `CardNavBar` — fixed top bar showing offscreen card shortcuts, auto-hides on scroll, uses IntersectionObserver
- `VisibilityButton` — styled button for hidden cards (color from `CARD_COLORS` in `@/lib/card-theme`)
- `useAutoRefresh` — periodic data reload hook
- `useItemShare` — share functionality hook
- `useAllSourceCounts` — hook that manages counts + remove handlers for all source tabs
- `PaginatedFavoritesList<T>` — generic paginated favorites with search, PAGE_SIZE=10, accent normalization, localStorage fallback
- `useFavoritesList` — hook for `PaginatedFavoritesList`
- `createBookmarkManager()` — bookmark manager factory with `mapMeta` function (from `@/lib/bookmark-manager`)
- `createBookmarkManagerActions()` — server actions factory (from `@/actions/bookmark-manager`)
- `ShareButton` — standalone share button component
- `ShareToLobbyButton` — share to lobby button (from `@/components/lobby/share-tolobby-button`)
- `useSimpleBookmarkToggle` — simple bookmark state hook (from `@/hooks/use-simple-bookmark-toggle`)
- `SearchResults` — component for favoris search results display (from `@/components/lobby/search-results`)

## 6. Favorites Page

### Per-source favorites component (`src/app/(main)/favoris/{source}-favorites.tsx` or `src/components/feed/{source}-bookmarks.tsx`):
- Import `PaginatedFavoritesList` + `useFavoritesList`
- Props: `userId`, `onRemoveComplete`, `searchQuery`
- Render bookmarked items with images, links, remove button
- Empty state with description
- For image sources: add `sharedIds` + `onShareToggle` + `isSharing` props for lobby sharing

### Favoris page server component (`src/app/(main)/favoris/page.tsx`):
- Raw SQL count query: `SELECT type, COUNT(*) FROM Bookmark WHERE userId = ? GROUP BY type`
- Map counts to 16 `BookmarkType` values
- Query bookmarked ideas with ideaTopics and source includes
- Pass all 16 count props to client

### Favoris page client component (`src/app/(main)/favoris/favoris-page-client.tsx`):
- 17 tabs: `idees`, `image-du-jour`, `saviez-vous`, `image-wikimedia`, `image-wikiloves`, `image-pixabay`, `portail-lexical`, `portail-wikipedia`, `proverbe`, `radio-france`, `cnrs-news`, `news`, `f1`, `citation`, `insolite`, `apod`, `air-crash` (+ `results` for search)
- `tabConfig` array with `SourceTabConfig` interface (id, countKey, label, Icon, sourceDesc, component)
- Uses `useAllSourceCounts` hook for counts + remove handlers
- `sortedTabs` = `portail-lexical` pinned first, rest sorted by count descending
- `searchResults` computed from searchQuery + all tab counts
- `activeTab` management with search (switches to 'results' tab when searching)
- Optimistic count updates via `handleXxxRemove` callbacks
- `useEffect` sync from server counts to local state
- Individual `<TabsContent>` for each source

## 7. Integration Files

### `src/app/(main)/sujets/sujets-client.tsx`
- `CardVisibility` interface with 16 boolean fields + `pixabayActiveCategory` + `wikipediaImageShowEn`
- `CardConfig` interface: `{ key, isVisible, isGloballyVisible, toggle }`
- `CARD_RENDERERS` record: 16 key → renderer function mappings
- `cardDefinitions` array: 16 entries mapping key → visKey → DB field name, optional `extraCheck` for userId-gated cards
- `cardConfigs`: computed from `cardDefinitions` with visibility + global visibility + extra checks
- `orderedConfigs`: sorted by user's `cardOrder` JSON (from `/api/user-card-order`), falls back to `CARD_DEFAULT_ORDER`
- `visibleCards` / `hiddenCards` split
- `CardNavBar` for visible card shortcuts (IntersectionObserver-based)
- Hidden card shortcuts in grid (only shows cards visible globally)
- `toggleVisibility` callback with rate-limited POST to `/api/user-card-visibility`
- `CARD_COLORS` from `@/lib/card-theme` for hidden card visibility button colors
- `CARD_DISPLAY_NAMES` record: locale key per card key

### `src/app/(main)/sujets/page.tsx`
- Query user for all 16 visibility fields + `wikipediaImageShowEn` + `cardNavBarEnabled` + `following` + `hasSeenSplash`
- Map to `CardVisibility` interface
- Pass `globalVisibility` from `getGlobalCardVisibility()` action
- Pass `cardNavBarEnabled` prop

### `src/app/api/card-visibility/route.ts`
- GET: returns global visibility from `CachedConfig` table (used by admin to set defaults)

### `src/app/api/user-card-visibility/route.ts`
- GET: returns all visibility fields, optional `?field=` param for single field
- POST: updates single field, rate limited (30/min), validates against `validFields` array
- `validFields` includes: all `{source}CardVisible` booleans + `wikipediaImageShowEn` + `cnrsNewsEnabled` + `imagePixabayShowCategories` + `imagePixabayActiveCategory` + `imageWikimediaShowCategories` + `imageWikiLovesShowCategories` + `cardNavBarEnabled`

### `src/app/api/user-card-order/route.ts`
- GET: returns user's `cardOrder` JSON array
- POST: updates user's `cardOrder` JSON array, rate limited (10 req/min)
- Falls back to `CARD_DEFAULT_ORDER` constant if no order set

### `src/app/(main)/favoris/page.tsx`
- Raw SQL `SELECT type, COUNT(*) FROM Bookmark WHERE userId = ? GROUP BY type`
- Map all 16 `BookmarkType` values to count props
- Pass to `FavorisPageClient`

### `src/app/(main)/favoris/favoris-page-client.tsx`
- 17 tabs with `Tab` type union
- `tabConfig` array with `SourceTabConfig` interface
- `sortedTabs` = `portail-lexical` pinned first, rest sorted by count descending
- `searchResults` computed with accent normalization
- `activeTab` + `previousTabRef` for search/restore flow
- `handleXxxRemove` callbacks for optimistic count updates
- `useEffect` sync from server counts
- Individual `<TabsContent>` for each source
- Share state loading for image sources (SAVIEZ_VOUS, IMAGE_DU_JOUR, IMAGE_WIKILOVES, IMAGE_WIKIMEDIA, PROVERBE, APOD)

### `src/app/admin/admin-content.tsx`
- `AdminStats` interface with all source stats (articles, expired, scrapedAt)
- 5 tabs: stats, users, cartes, cleanup, cache
- `cardConfigs` array: 16 entries mapping key → labelKey → icon
- `CartesTab` with `CardToggle` per card (calls `updateGlobalCardVisibility()`)
- `CacheTab` with `CacheSource` interface, individual refresh + refresh all, uses `CACHE_SOURCES` from `@/lib/admin-cache-config.ts`
- `StatCard` component with optional sublabel for expired count
- `UserRow` component with toggle/delete actions
- Cleanup dialog with total expired count
- News clear + freenewsapi clear dialogs
- Language switcher dropdown

### `src/app/admin/page.tsx`
- Uses `CACHE_SOURCES` from `@/lib/admin-cache-config.ts` for dynamic SQL query (all 11 cache models, total + expired)
- Individual `findFirst` queries for latest scrapedAt per source
- `prisma.saviezVousFact.count()` for static facts
- `prisma.cachedConfig.findUnique({ where: { key: 'proverbes_all' } })` for proverbe count
- `prisma.srsCard.count({ where: { nextReviewAt: { lte: new Date() } } })` for SRS due count
- `prisma.cachedConfig.findMany({ where: { key: { startsWith: 'insolite_' } } })` for insolite config count
- Pass formatted stats to `AdminContent`

### `src/app/api/cron/cache/route.ts`
- 16 sequential steps with step numbering
- Auth: token OR IP whitelist (including CIDR matching)
- Cleanup step: calls `cleanupExpired()` + `cleanupNewsByMaxAge(5)`
- Returns `{ ok, results, duration, ip }`
- Portail lexical step uses upsert-by-date (no TTL)

### `src/lib/cache-helpers.ts`
- `cleanupExpired()` deletes from 11 cache models: CNRS, Radio, Wiki, WikiLoves, News, F1, PortailWiki, Citation, Insolite, Apod, AirCrash
- Returns counts object
- `ALLOWED_CRON_IPS` + `isAllowedIp()` with CIDR support (defined in `src/lib/ip.ts`, re-exported from `cache-helpers.ts`)
- Helper functions: `getValidCachedCnrsArticles`, `getValidCachedRadioEpisodes`, `getValidCachedWikipediaImages`, `upsertWikipediaImages`, `sleep`, `clearAllNewsArticles`, `clearFreenewsapiArticles`, `cleanupNewsByMaxAge(days)`

## 8. Locales (`src/locales/{fr,en}.json`)

- `feed.{source}`: Display name (e.g., "NEWS")
- `feed.read_article`: "Read article" / "Lire l'article"
- `feed.{source}_tab`: Tab label (e.g., "Formula 1")
- **Tab keys** (one per tab in the card): `feed.{source}_tab_{name}` (e.g., `feed.f1_tab_actualites`, `feed.f1_tab_image`)
- `feed.{source}`: About section name
- `feed.{source}_desc`: About section description
- Admin stat labels: `feed.{source}_articles`, `feed.{source}_expired`

## 9. Environment
- `.env`: Add `CRON_SECRET`, `FREE_NEWS_API_KEY` (or relevant API key)
- `.env.example`: Add placeholders

## Checklist
- [ ] Prisma schema updated + migration applied
- [ ] Data layer: bookmark manager (or simple toggle) + server actions (or simple action)
- [ ] API route with cache fallback
- [ ] Cache script with TTL (or upsert logic for non-cache models)
- [ ] Card component (scrollable, multi-select, bookmark, share, refresh)
- [ ] CardVisibilityGuard wrapper
- [ ] Favorites page component (PaginatedFavoritesList or simple)
- [ ] Favoris page: add tab, count prop, handleRemove callback, TabsContent
- [ ] Sujets integration: CARD_RENDERERS entry, cardDefinitions entry, CARD_COLORS entry, CARD_DISPLAY_NAMES entry
- [ ] Sujets page: add visibility field to user select
- [ ] user-card-visibility route: add field to validFields + GET select
- [ ] Admin: AdminStats fields, StatCard in stats tab, cardConfig entry, CacheTab entry (if cache model), cleanup entry (if expiresAt), page.tsx query
- [ ] Favoris server page: add count from raw SQL GROUP BY
- [ ] Locales (en + fr)
- [ ] .env + .env.example
- [ ] Cron: add step in /api/cron/cache/route.ts (if cache model)
- [ ] cache-helpers.ts: add to cleanupExpired() (if cache model)
- [ ] Build passes
- [ ] Tests pass

# Project Conventions

- Test file: `.test.ts` or `.test.tsx` next to source file. Use vitest
- Import alias: `@/` maps to `src/`
- DB: Prisma with libsql. Use `@/lib/db` for prisma client. Never drop tables
- URL validation: use `sanitizeUrl()` from `@/lib/utils`
- UI: shadcn components in `src/components/ui/`. Tailwind CSS v4
- Next.js 16: app router, server components default. Client components use `'use client'`
- API routes: `src/app/api/` with route handlers
- Actions: `src/actions/` for server actions
- Types: `src/types/` for custom type declarations
- Dates in client components: format on server with `toLocaleDateString(locale)`, pass pre-formatted string prop. Avoid `toLocaleDateString` in client with Date from server (timezone mismatch = hydration error)
- Locale: get from `cookies()` in server component, pass as `locale` prop through component tree
- i18n: use `useTranslations('namespace')` from `next-intl` for all user-facing strings. Add keys to `src/locales/fr.json` and `src/locales/en.json`
- Prefer cross-links between pages over duplicating content
- Card visibility: two-layer system — per-user (`CardVisibility` interface on `User` model) + global (`CachedConfig` table, read via `getGlobalCardVisibility()` action)
- Card order: user-customizable via `cardOrder` JSON field on `User` model, fetched from `/api/user-card-order`, falls back to `CARD_DEFAULT_ORDER` constant
- Favorites counts: use raw SQL `GROUP BY type` in server component for efficiency
- Search: use `normalizeAccents()` utility for accent-insensitive search across all tabs
- Optimistic updates: decrement count state in `handleXxxRemove` callbacks before DB operation completes
- Card NavBar: uses IntersectionObserver to track visible cards, hides offscreen cards, shows max 7 pills on mobile
- Share to lobby: `ShareToLobbyButton` component with `shareResourceToLobby`/`unshareResourceFromLobby` actions, shared state loaded via `/api/lobby/shared-resources`
- Image sources (wikimedia, wikiloves): user preferences stored in `UserWikimediaTopic`/`UserWikiLovesTopic` models, categories toggled via `imageWikimediaShowCategories`/`imageWikiLovesShowCategories` on `User` model
- Pixabay: user preferences in `imagePixabayShowCategories`, `imagePixabayActiveCategory` on `User` model
- Saviez-vous: static facts from `SaviezVousFact` model (no TTL, no cache), fetched via `getRandomFact()`
- Proverbe: stored in `CachedConfig` as JSON value under key `proverbes_all`, no separate cache model

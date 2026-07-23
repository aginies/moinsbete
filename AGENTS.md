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

Every new card source must include these files/patterns:

## 1. Prisma Schema (`prisma/schema.prisma`)
- Add `Cached{Source}Article` model with: `id`, `title`, `description`, `url`, `imageUrl`, `source`, `category`, `publishedAt`, `scrapedAt`, `expiresAt`
- Add `{SOURCE}_NEWS` to `BookmarkType` enum
- Add `{source}CardVisible` boolean to `User` model

## 2. Data Layer
- `src/lib/{source}-bookmark.ts` - Bookmark manager with `createBookmarkManager()`
- `src/actions/{source}-bookmark-actions.ts` - Server actions (`toggle{Source}FavoriteAction`, `get{Source}FavoritesAction`, `is{Source}FavoriteAction`)
- `src/data/{source}.json` - Static JSON fallback (10 articles per category)

## 3. API Route (`src/app/api/{source}/route.ts`)
- `GET` endpoint with rate limiting
- Query params: `?categories=cat1,cat2` (multi-select), `?exclude=url`
- Priority: DB cache → JSON fallback
- Return random batch (10-20 articles)
- Support category filtering

## 4. Cache Script (`src/scripts/cache-{source}.ts`)
- Fetch from external API
- Upsert to DB with 6h TTL
- Run via cron (3x daily: 6:00, 12:00, 18:00)
- Export `scrapeAndCache{Source}()` function

## 5. Card Component (`src/components/feed/{source}-card.tsx`)
- `'use client'` component
- Props: `onToggle`, `userId`, `showToggle`, `isVisible`
- State: `articles`, `loading`, `error`, `selectedCategories`, `favorites`
- Features:
  - Scrollable list (maxHeight 700px for 20 items)
  - Category selector (multi-select toggle)
  - Bookmark per article (inline handler, not useSimpleBookmarkToggle in loop)
  - Share button
  - Visibility toggle button
  - Refresh button
  - Error state handling
- Use `useCardVisibility` hook for show/hide
- Use `useItemShare` for sharing

## 6. Favorites Page (`src/app/(main)/favoris/{source}-favorites.tsx`)
- Import `PaginatedFavoritesList` + `useFavoritesList`
- Props: `userId`, `onRemoveComplete`, `searchQuery`
- Render bookmarked items with images, links, remove button
- Empty state with description

## 7. Integration Files

### `src/app/(main)/sujets/sujets-client.tsx`
- Import card component
- Add `{source}` to `CardVisibility` interface
- Add to default visibility object
- Add to default cardOrder array
- Add `toggle{Source}` callback
- Add card config to `cardConfigs` array
- Add to useMemo dependency array

### `src/app/(main)/sujets/page.tsx`
- Add `{source}CardVisible` to user select
- Add `{source}` to visibility object

### `src/app/(main)/favoris/page.tsx`
- Add `{source}FavoritesCount` query
- Pass to `FavorisPageClient`

### `src/app/(main)/favoris/favoris-page-client.tsx`
- Import `{source}Favorites`
- Add `{source}FavoritesCount` to props interface
- Add `{source}-news` to `Tab` type
- Add count state + sync useEffect
- Add `handle{Source}Remove` callback
- Add tab config to `tabConfig`
- Add to search results placeholder
- Add `<TabsContent value="{source}-news">`

### `src/app/admin/admin-content.tsx`
- Add to `cardConfigs` array
- Add `{source}Articles` and `{source}Expired` to `AdminStats` interface
- Add StatCard in stats tab
- Add expired items in cleanup tab
- Update Dialog count

### `src/app/admin/page.tsx`
- Add `{source}Count` and `{source}ExpiredCount` queries
- Pass to `AdminContent`

### `src/app/api/cron/cache/route.ts`
- Import `scrapeAndCache{Source}`
- Add step in GET handler
- Add to cleanup results

### `src/lib/cache-helpers.ts`
- Add cleanup for `{source}Article` in `cleanupExpired()`

## 8. Locales (`src/locales/{fr,en}.json`)
- `feed.{source}`: Display name (e.g., "NEWS")
- `feed.read_article`: "Read article" / "Lire l'article"
- `feed.{source}_tab`: Tab label
- `feed.{source}`: About section name
- `feed.{source}_desc`: About section description
- `feed.{source}_articles`: Admin stat label
- `feed.{source}_expired`: Admin expired label

## 9. Environment
- `.env`: Add `FREE_NEWS_API_KEY` (or relevant API key)
- `.env.example`: Add placeholder

## Checklist
- [ ] Prisma schema updated + migration applied
- [ ] Data layer (bookmark + actions)
- [ ] API route with cache fallback
- [ ] Cache script with TTL
- [ ] Card component (scrollable, multi-select, bookmark, share, refresh)
- [ ] Favorites page
- [ ] Sujets integration (visibility, toggle, card config)
- [ ] Favoris integration (count, tab, search)
- [ ] Admin integration (stats, cleanup, toggle)
- [ ] Locales (en + fr)
- [ ] .env + .env.example
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

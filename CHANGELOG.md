# Changelog v6.0.15 → v7.0.1

## 🆕 New Features

### Portail Wikipédia
- New **Portail Wikipédia** card with multi-article display, search, cache, and admin integration
- Share to lobby support for Portail Wikipédia bookmarks

### Formula 1 Card
- New **F1 card** with multiple tabs: Actualités (News), Image du jour, Podium (standings), Saviez-vous
- F1 wiki parser for image du jour, standings table with points
- F1 cache script with 5x daily cron schedule
- Image lightbox with click-to-enlarge

### PWA
- **Full offline support** — app shell + content caching with manual Service Worker (next-pwa incompatible with Turbopack)
- Precache JS/CSS chunks for offline
- Manifest with correct Content-Type, `display_override: standalone` for Android Auto compatibility
- Improved install experience

### News Card (FreeNewsAPI)
- Renamed BBC News → **NEWS** (migrated to FreeNewsAPI)
- New categories: crypto, AI, cinema, auto, golf, vehicles, internet security, movies, gadgets
- Virtualized list with search in NewsCard
- Infinite scroll on /news page
- Filter toggle with localStorage persistence
- Share to lobby per-article
- 24h TTL, 5x daily cron (6h, 12h, 15h, 16h, 21h)

### Search
- Search results as CompactIdeaCard with i18n, spinner, locale-aware texts
- Proverbes and Wikipedia images included in search results

### Lobby
- Email notifications on targeted card share
- Share/unshare toggle for SAVIEZ_VOUS and IDEA types
- Shared recipients display + community badge
- /lobby/a-propos page with lobby guide
- Conditional help dialog (lobby help on /lobby, regular help elsewhere)

### UX
- **Splash screen** on first login + help button in navbar
- 24h auto-refresh on all cards on mount
- Page SEO metadata for /sujets + aria-labels on icon buttons
- Persist wikimedia/wikiloves topic selection across sessions
- Persist pixabay active category per user
- Turnstile invisible captcha with dev bypass
- Maintenance page shown during PM2 deploy

### Admin
- Cache refresh tab with scrapedAt display
- User delete with cascade removal and confirmation dialog
- Admin button to clear FreeNewsAPI articles from cache

## 🔧 Fixes

### Performance
- Batch DB queries for favoris and admin pages
- Add `.select()` to feed API query — exclude unused columns
- Database indexes for frequent query patterns
- Batch prev/next queries, limit unbounded queries
- Batch lobby N+1, deduplicate idea query, limit suggestions, add IdeaTopic index
- Remove CNRS live scraping from API route
- LRU eviction on TTL cache (max 1000 entries)
- `decoding=async` on images to offload main thread
- Remove redundant useEffect in CardHeader auto-refresh
- Memoize swipe gesture handlers, use ref in useItemShare
- Fix virtualizer estimate size in NewsCard

### Security
- Escape HTML in `highlightMatch()` to prevent XSS
- Meta injection fix, strict schema validation
- Directory exposure fix, hide email+role, limit results
- IDOR admin check, console masking
- Remove HTTP cookie, dev bypass, console leaks
- Auth check on lobby GET endpoints
- One-time password hash fix

### Cron & Deploy
- **Deprecate PM2 cron runner** → CLI cron with crontab support
- Batch DB upserts with `$transaction` (prevents socket timeout)
- Fix cron step numbering, add retry for 429 rate limits
- Rsync exclude order fix, build fail detection, PM2 health check
- DB backup in SRC dir, rm .next before build for clean production builds
- Add `has_seen_splash` migration, make migrate deploy non-fatal

### Cards
- Centralize card visibility in parent, remove `useCardVisibility` from feed cards
- Fix hydration mismatch: `window.location.reload` → `router.refresh`
- Fix card visibility API: remove broken CSRF check
- Replace nested `import()` CSRF flow with `useRef`
- Fix saviez-vous fact not updating on prop change
- Fix play/pause counter not starting in image cards
- Fix overflow/scroll issues in card containers
- Fix double bookmark button on cover image
- Fix CNRS: return random article instead of always latest
- Clear image on CNRS refresh, hide image during saviez-vous refresh

### i18n
- Translate news card category labels
- i18n for card-ordering component in /mon-compte
- i18n for /sujets page + fix all-selected topic toggle desync

### Database
- Prisma singleton leak fix in production
- Parameterize raw SQL queries in feed-helpers
- Remove quotes from enum @default values for production compatibility

## 🗑️ Removed
- `redis` package (kept `ioredis` for local Redis)
- Dead F1 code (isSundayAfternoon, shouldUpdateImage, parseLumiereSur, f1_tab_lumiere)
- Unused `/api/topics/suggest` route
- BBC News JSON fallback (DB cache only)
- Turnstile verification from registerAction
- Exposed security docs

# Bookmark Manager Consolidation — Completed

## Summary

Consolidated 14 source-specific bookmark action files into single file. Removed factory indirection. All tests pass, build passes.

**Result: -48 lines net** (174 deleted, 126 added)

## Changes Made

### 1. Consolidated 14 action files → 1 file

**Deleted:**
- `src/actions/radio-bookmark-actions.ts`
- `src/actions/cnrs-bookmark-actions.ts`
- `src/actions/news-bookmark-actions.ts`
- `src/actions/saviez-vous-bookmark-actions.ts`
- `src/actions/image-du-jour-bookmark-actions.ts`
- `src/actions/image-pixabay-bookmark-actions.ts`
- `src/actions/image-wikimedia-bookmark-actions.ts`
- `src/actions/image-wikiloves-bookmark-actions.ts`
- `src/actions/proverbe-bookmark-actions.ts`
- `src/actions/f1-bookmark-actions.ts`
- `src/actions/citation-bookmark-actions.ts`
- `src/actions/insolite-bookmark-actions.ts`
- `src/actions/portail-lexical-bookmark-actions.ts`
- `src/actions/portail-wikipedia-bookmark-actions.ts`
- `src/actions/bookmark-actions-factory.ts` (9-line indirection)

**Modified:**
- `src/actions/bookmark-actions.ts` — now contains all 14 source bookmark managers + legacy idea actions

### 2. Updated 20 consumer files

All consumers now import from `@/actions/bookmark-actions`:

```ts
// Before
import { toggleRadioFavoriteAction } from '@/actions/radio-bookmark-actions'

// After
import { toggleRadioFavoriteAction } from '@/actions/bookmark-actions'
```

### 3. Fixed portail-wikipedia-card

Card used `toggleBookmarkAction` (legacy 1-arg function). Changed to `togglePortailWikipediaFavoriteAction`.

## Architecture

```
src/actions/bookmark-actions.ts
├── Legacy idea actions (bookmarkAction, toggleBookmarkAction, getSavedIdeas)
├── Topic actions (toggleTopic, getFollowedTopics)
└── 14 source bookmark managers (created via createBookmarkManagerActions)
    ├── Radio France
    ├── CNRS
    ├── News
    ├── Saviez-vous
    ├── Image du jour
    ├── Pixabay
    ├── Wikimedia
    ├── Wiki Loves
    ├── Portail Lexical
    ├── Portail Wikipedia
    ├── Proverbe
    ├── F1
    ├── Citation
    └── Insolite
```

## Verification

- ✅ `npm run build` passes
- ✅ `npm test` passes (359 tests)
- ✅ No breaking changes to existing imports (all exports preserved)

## Remaining Duplication

### Lib files (14 files, ~30-45 lines each)

Each source-specific lib file defines:
- Source-specific `*FavoriteMeta` interface
- Source-specific `*FavoriteDoc` interface (optional)
- `*Manager` instance via `createBookmarkManager()`
- Convenience exports (`getXxxFavorites`, `getXxxFavoritesCount`)

**Not consolidated** — Meta/Doc interfaces are source-specific and needed by consumers.

### Pattern already well-extracted

- `createBookmarkManager()` — factory in `bookmark-manager.ts`
- `createBookmarkManagerActions()` — server action factory in `actions/bookmark-manager.ts`
- `toggleBookmark()`, `isBookmarked()`, etc. — low-level helpers in `favorite.ts`

The duplication was minimal. Factories already extracted. This consolidation removes boilerplate.

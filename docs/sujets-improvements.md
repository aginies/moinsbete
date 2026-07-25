# /sujets Page Improvements

## Critical

### 1. Dual visibility state conflict
`sujets-client.tsx` manages visibility state, passes `userId={undefined}` to cards to short-circuit their `useCardVisibility` hook, then syncs via separate `updateCardVisibility` fetch. Each card also runs its own hook. Two systems, race conditions, confusion. Pick one: parent manages all visibility, or cards manage their own.

### 2. Hardcoded strings ✅ FIXED
"AMÉLIORATION EN COURS", "Afficher", "Carte aléatoire", "Choisissez vos sujets", toast message in `topic-card.tsx:30-34`. i18n keys existed in locales but weren't used. Now using `useTranslations('feed')` / `getTranslations('feed')`.

Files modified:
- `src/app/(main)/sujets/page.tsx` — banner strings
- `src/app/(main)/sujets/sujets-client.tsx` — visibility button + random card CTA
- `src/app/(main)/sujets/[slug]/page.tsx` — error pages, headings
- `src/components/topics/topic-card.tsx` — login toast
- `src/locales/fr.json` + `src/locales/en.json` — added `login_toast`, `login_button`, `show_card`, `db_maintenance_title`, `db_maintenance_desc`

## UX

### 4. "All selected" inversion ✅ FIXED

`isAllSelected` was static, never updated. Follow all → unfollow one = desync, only reload fixed.

Fix: derive `isAllSelected` from `followedIdsSet.size === allTopics.length`. Remove `allSelected` prop from `TopicGrid`/`TopicCard`. Fix `setFollowing(following)` stale closure → `setFollowing(f => !f)`.

Files modified:
- `src/app/(main)/sujets/sujets-client.tsx` — reactive `isAllSelected`, simplified `handleToggle`, removed `allSelected` prop
- `src/components/topics/topic-card.tsx` — removed `allSelected` prop, fix `newState` + error revert
- `src/components/topics/topic-grid.tsx` — removed `allSelected` prop

### 5. Card reorder — fetch but no UI ✅ NOT A BUG
`cardOrder` fetched from API (`sujets-client.tsx:156-162`), applied to sort. No drag-and-drop or settings to edit order. Dead feature.

**Correction:** `/mon-compte` has full drag-and-drop card ordering UI (`CardOrdering` component with `@dnd-kit`). The fetch is the consumer.

**Bonus fix:** `CardOrdering` had 3 hardcoded strings ("Ordre des cartes" x2, "Réinitialiser", "Glissez-déposez..."). Locale keys `card_order`, `reset`, `drag_order` already existed. Now using `useTranslations('feed')`.

File modified:
- `src/components/settings/card-ordering.tsx`

### 6. Blank loading state
`sujets-client.tsx:285-287`: returns `null` while loading card order. White flash. Add skeleton.

### 7. Random card CTA ambiguous
Link text switches between "Carte aléatoire" and "Choisissez vos sujets" based on state. Condition is complex (`userId && followedIds.length > 0 || isAllSelected`). Guest user sees "Choisissez vos sujets" linking to `/sujets` (self). Should show different copy or hide.

## Performance

### 8. `cardConfigs` useMemo — too many deps
`sujets-client.tsx:270`: 10 toggle functions + visibility + globalVisibility + hasUserId. Any toggle recreate all 10 callbacks = recalc. Extract toggle map, stable reference.

### 9. SSR API fetch in slug page
`[slug]/page.tsx:38-40`: server component fetches from own API route. Defeats SSR. Call DB directly or use `mapIdeaWithTopics` pattern.

## Accessibility

### 10. Missing aria labels
Topic bookmark button, visibility buttons, random card link. Emoji as icon (`🎲`). No keyboard hints.

### 11. No error boundary
Card crash = page crash. Wrap card list in `<ErrorBoundary>`.

## Code quality

### 12. Repetitive card config pattern
`cardConfigs` array: 10 near-identical objects. `CARD_RENDERERS`: same props pattern. Config-driven factory function eliminates ~100 lines.

### 13. `TopicCard` error revert confusing
`topic-card.tsx:45`: `setFollowing(following)` uses stale closure. Works, but reads like no-op. Use functional updater: `setFollowing(prev => !prev)`.

### 14. Duplicate `toggleBookmarkAction`
Exists in both `bookmark-actions.ts:40` and `favorite-actions.ts:8`. Consolidate.

### 15. `REGISTRATION_LOCKED` banner
`page.tsx:74-86`: hardcoded dev warning. Remove or feature-flag properly.

## SEO

### 16. No metadata
No `generateMetadata` for `/sujets` or `/sujets/[slug]`. Title, description, OG images missing.

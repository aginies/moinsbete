# Centralize Card Styling

## Problem

Every card repeats the same pattern with hardcoded color classes:

```
border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50
dark:border-green-700 dark:from-green-950/30 dark:to-emerald-950/30
text-green-800 dark:text-green-300
bg-green-500 dark:bg-green-600
```

Same 10-15 class variants per color, duplicated across 16 card files + `visibility-button.tsx` + `card-nav-bar.tsx`.

### Current color maps (duplicated)

| File | Purpose |
|---|---|
| `visibility-button.tsx` | `colorMap` — 9 colors, 10 variants each (border, bg, text, hover, dark) |
| `card-nav-bar.tsx` | `COLOR_MAP` — 9 colors, 4 variants each (bg, text, darkBg, darkText) |
| `sujets-client.tsx` | `HIDDEN_CARD_COLORS` — 13 cards → color name mapping |
| Each `*-card.tsx` | Inline Tailwind classes, unique per card |

### Current card inventory

16 card files in `src/components/feed/`:

- `saviez-vous-card.tsx` — uses `CardHeader`, swipe logic
- `wikipedia-image-card.tsx` — uses `BaseImageCard`
- `cnrs-news-card.tsx` — single article, inline header
- `radio-france-card.tsx` — tabbed (audio/articles)
- `news-card.tsx` — virtualized list, category filter
- `image-wikimedia-card.tsx` — uses `BaseImageCard`
- `image-wikiloves-card.tsx` — uses `BaseImageCard`
- `image-pixabay-card.tsx` — uses `BaseImageCard`
- `portail-lexical-card.tsx` — single item (word of the day)
- `portail-wikipedia-card.tsx` — tabbed
- `proverbe-card.tsx` — single item
- `f1-card.tsx` — 5 tabs (image, actualites, fia, classement, saviez)
- `citation-card.tsx` — 3 tabs (auteurs, dujour, themes)
- `base-image-card.tsx` — generic template for image cards
- `idea-card.tsx` — core idea display
- `swipe-background-card.tsx` — swipe transition layer

---

## Phase 1: Central theme definition

**New file: `src/lib/card-theme.ts`**

- `CardColorName` type: `'teal' | 'blue' | 'purple' | 'amber' | 'green' | 'rose' | 'orange' | 'emerald' | 'indigo'`
- `CardTheme` interface with all class variants per color:
  - Shell: `border`, `borderDark`, `bgGradient`, `bgGradientDark`, `shadow`
  - Icon: `iconBg`, `iconBgDark`, `iconForeground`
  - Text: `title`, `titleDark`, `body`, `bodyDark`, `link`, `linkDark`, `muted`, `mutedDark`
  - Action: `action`, `actionDark`, `actionHover`, `actionHoverDark`
  - Pills: `pillBorder`, `pillBg`, `pillText`, `pillBorderDark`, `pillBgDark`, `pillTextDark`
  - Header divider: `headerBorder`, `headerBorderDark`
  - Skeleton: `skeletonBg`, `skeletonBgDark`
  - Visibility button: `visBorder`, `visBg`, `visText`, `visDarkBorder`, `visDarkBg`, `visDarkText`, `visHoverBorder`, `visHoverBg`, `visDarkHoverBorder`, `visDarkHoverBg`
  - Nav bar: `navBg`, `navText`, `navDarkBg`, `navDarkText`
- `CARD_THEMES` record: `Record<CardColorName, CardTheme>`
- `CARD_COLORS` record: card key → `CardColorName` (replaces `HIDDEN_CARD_COLORS`)
- `getTheme(color)` helper function

**Update existing files:**

- `visibility-button.tsx` → import `CARD_THEMES`, remove inline `colorMap`
- `card-nav-bar.tsx` → import `CARD_THEMES`, remove inline `COLOR_MAP`
- `sujets-client.tsx` → import `CARD_COLORS`, replace `HIDDEN_CARD_COLORS`

**Result:** 3 duplicate color maps eliminated. Single source of truth for all card colors.

---

## Phase 2: CardShell component

**New file: `src/components/feed/card-shell.tsx`**

```tsx
interface CardShellProps {
  color: CardColorName
  padding?: string      // default "p-3 sm:p-5"
  noPadding?: boolean   // for tabbed cards (F1, citation)
  children: React.ReactNode
  className?: string    // additional classes
}
```

Applies shell classes from theme: border, gradient, border radius, shadow, padding, transition.

---

## Phase 3: Refactor CardHeader

**Update `src/components/feed/card-header.tsx`**

Accept `color: CardColorName` prop instead of 7 individual color props:

```tsx
// Before
<CardHeader
  icon={<Lightbulb />}
  iconBgColor="bg-blue-400"
  iconDarkColor="dark:bg-blue-600"
  title="saviez-vous ?"
  titleColor="text-blue-800"
  titleDarkColor="dark:text-blue-300"
  ...
/>

// After
<CardHeader color="blue" icon={<Lightbulb />} title="saviez-vous ?" ... />
```

Resolves all color props from `CARD_THEMES[color]` internally.

---

## Phase 4: Migrate cards

Iterative, per-card. No visual change — just swap inline classes for theme lookups.

**Order (easy → hard):**

1. `proverbe-card.tsx` — simple, single item
2. `portail-lexical-card.tsx` — simple, single item
3. `cnrs-news-card.tsx` — single article, inline header
4. `wikipedia-image-card.tsx` — uses `BaseImageCard`
5. `image-wikimedia-card.tsx` — uses `BaseImageCard`
6. `image-wikiloves-card.tsx` — uses `BaseImageCard`
7. `image-pixabay-card.tsx` — uses `BaseImageCard`
8. `saviez-vous-card.tsx` — uses `CardHeader`, swipe logic
9. `radio-france-card.tsx` — tabbed
10. `news-card.tsx` — virtualized list
11. `portail-wikipedia-card.tsx` — tabbed
12. `f1-card.tsx` — 5 tabs, complex
13. `citation-card.tsx` — 3 tabs, complex

**For each card:**
- Replace shell class string → `<CardShell color="...">` or `getTheme(color)` classes
- Replace inline color classes → theme lookups
- Replace `CardHeader` color props → single `color` prop
- Remove inline `CATEGORY_COLORS` maps where applicable

---

## Phase 5: Clean up sujets-client.tsx

- Import `CARD_COLORS` from `card-theme.ts`
- Remove `HIDDEN_CARD_COLORS` constant
- `CardNavBar` color prop uses same source

---

## Phase 6 (Optional): CSS variables

Convert theme to CSS custom properties for runtime theming:

```css
/* globals.css */
.card-theme--green {
  --card-border: oklch(...);
  --card-bg-from: oklch(...);
  --card-title: oklch(...);
}
```

Rewrite Tailwind classes to `var(--card-*)`. Bigger change, enables runtime theme switching.

**Recommendation:** Complete Phase 1-5 first, then decide.

---

## Questions / Decisions Needed

1. **Scope** — Phase 1-5 only (Tailwind centralized) or also Phase 6 (CSS variables)?
2. **CardShell** — Wrapper component preferred, or just `CARD_THEMES` record + `getTheme()` utility? Wrapper adds consistency but touches every card file.
3. **CardHeader refactor** — Consolidate 7 color props into 1 `color` prop? Breaking change for existing callers, but cleaner API.
4. **Image cards** — `BaseImageCard` already accepts color config via props. Migrate its callers to use `CARD_THEMES` or keep as-is?

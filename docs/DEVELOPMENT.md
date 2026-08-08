# Développement

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js App Router, React Server Components |
| Backend | API Routes Next.js, Prisma ORM |
| Base de données | SQLite (fichier .db) |
| Authentification | NextAuth v4 + bcrypt |
| Génération de contenu | LLM OpenAI-compatible |
| Ingestion Wikipédia | REST API fr.wikipedia.org |

## Commandes principales

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npx prisma studio` | Interface DB |
| `npm test` | Exécuter tous les tests (359 tests) |
| `npx tsx src/scripts/seed-ideas.ts` | Seed manuel |
| `npx tsx src/scripts/generate-ideas.ts` | Génération LLM |
| `npx tsx scripts/scrape-saviez-vous.ts` | Scraper Wikipédia |
| `npm run cache:all` | Lancer tous les caches |
| `npm run cache:insolite:enrich` | Enrichir images insolites |

## Tests

359 tests sur 31 fichiers (vitest).

```bash
npm test              # Exécuter tous les tests
npm test -- --watch   # Mode watch
```

Couverture :
- `src/lib/` — utils, slugify, url validation, rate-limiter, csrf, auth, bookmark, feed-helpers, saviez-vous, view, llm, radio-bookmark, image-url-encoder, constants
- `src/actions/` — auth-actions, bookmark-actions, topic-actions, view-actions, review-actions
- `src/scripts/` — seed-ideas data validation
- `src/app/` — robots.txt, feed helpers, pagination, wikimedia-topics route
- `src/hooks/` — use-card-visibility

## Architecture des pages

```
/                          → Redirection vers /sujets
/sujets                    → Grille des topics + recherche + cartes feed
/sujets/[slug]             → Détail d'un topic + idées associées
/idees/[slug]              → Détail d'une idée
/idees/au-hasard           → Idée aléatoire (option: ?followed=1)
/ma-bibliotheque           → Bookmarks utilisateur (auth requis)
/favoris                   → Favoris / bookmarks (auth requis)
/mon-historique            → Historique de consultation (auth requis)
/mon-compte                → Profil utilisateur (auth requis, card ordering)
/a-propos                  → Page d'information
/login                     → Connexion
/register                  → Inscription (Turnstile captcha)
/admin                     → Dashboard admin (stats, users, cartes, cleanup)
/admin/review/topics       → Review de topics suggérés
/portail-lexical           → Portail lexical (mot du jour + recherche)
/le-saviez-vous            → Le saviez-vous (facts from Wikipedia)
/image-wikimedia           → Image Wikimedia (redirect)
/image-wikiloves           → Wiki Loves images (redirect)
```

## API

| Route | Méthode | Description | Rate Limit |
|-------|---------|-------------|------------|
| `/api/feed` | GET | Liste des idées (paginé, filtrable par topic) | — |
| `/api/search?q=` | GET | Recherche dans idées, topics, sources | 30/min IP |
| `/api/ideas/[slug]/bookmark` | POST | Toggle bookmark | — |
| `/api/ideas/random` | GET | Idée aléatoire | — |
| `/api/ideas/[slug]/view` | POST | Marquer idée comme vue | — |
| `/api/history` | GET | Historique de consultation (auth requis) | 60/min user |
| `/api/saviez-vous` | GET | Fait "Le saviez-vous" aléatoire | 20/min IP |
| `/api/radio-france` | GET | Épisodes Radio France | 30/min IP |
| `/api/wikipedia-image` | GET | Image Wikipédia | 10/min IP |
| `/api/image-wikimedia` | GET | Image Wikimedia (redirect vers wiki API) | 30/min IP |
| `/api/image-wikiloves` | GET | Image Wiki Loves (cache dédié) | 30/min IP |
| `/api/image-pixabay` | GET | Vidéos Pixabay | 30/min IP |
| `/api/cnrs-news` | GET | Articles CNRS | 30/min IP |
| `/api/news` | GET | Actualités NEWS | 30/min IP |
| `/api/f1` | GET | Articles Formule 1 | 30/min IP |
| `/api/citation` | GET | Citations Wikiquote | 30/min IP |
| `/api/portail-wikipedia` | GET | Articles Portail Wikipédia | 30/min IP |
| `/api/portail-lexical` | GET | Mot du jour Portail Lexical | 30/min IP |
| `/api/insolite` | GET | Articles insolites (1/jour) | 30/min IP |
| `/api/card-visibility` | GET | Global card visibility (admin) | — |
| `/api/user-card-visibility` | GET/POST | Toggle user card visibility (session auth) | 30/min user |
| `/api/user-card-order` | GET/POST | Get/set user card order (CSRF) | — |
| `/api/wikimedia-topics` | GET/POST | User wikimedia topics (CSRF) | — |
| `/api/image-wikiloves-topics` | POST | Toggle wiki loves topics (CSRF) | — |
| `/api/auth/reset-password/generate` | POST | Générer token reset | 3/min IP |
| `/api/auth/reset-password` | POST | Reset mot de passe | 5/min IP |
| `/api/admin/suggestions/[id]/approve` | POST | Approuver suggestion (admin) | — |
| `/api/admin/suggestions/[id]/reject` | POST | Rejeter suggestion (admin) | — |
| `/api/admin/suggestions/[id]/merge` | POST | Fusionner suggestion (admin) | — |
| `/api/lobby` | GET | Shared lobby bookmarks | — |
| `/api/lobby/[id]` | POST/DELETE | Share/unshare to lobby (CSRF) | — |
| `/api/cron/cache` | GET | Cron cache endpoint (10 étapes) | Token/IP |
| `/api/favorites/export` | GET | Export favoris HTML + image | Auth |

## Ajouter un nouveau topic

1. Ajouter dans `prisma/seed.ts` → `ROOT_TOPICS` :
```ts
{ name: 'Nouveau Sujet', icon: '🎯', color: '#ff6b35', description: 'Description' }
```

2. Ajouter des idées dans `IDEAS` :
```ts
{
  title: "Titre de l'idée",
  content: "Contenu explicatif...",
  takeaway: "Takeaway actionnable...",
  sourceTitle: "Source Wikipédia",
  topicNames: ['Nouveau Sujet']
}
```

3. Exécuter :
```bash
npx prisma db seed
```

## Générer plus d'idées avec le LLM

1. Ajouter le topic à `TOPICS_TO_GENERATE` dans `src/scripts/generate-ideas.ts`
2. Ajouter les articles Wikipédia dans `TOPIC_ARTICLES`
3. Exécuter :
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx src/scripts/generate-ideas.ts
```

## Admin

Rôle `ADMIN` requis pour accéder à `/admin` et aux routes API admin.

### Onglets admin

1. **Stats** — Compteurs par modèle DB + items expirés (14 cartes feed)
2. **Users** — Liste utilisateurs avec toggle enabled/disabled
3. **Cartes** — Toggle global visibility par carte feed (14 cartes)
4. **Cleanup** — Suppression des items expirés (9 cache models)
5. **Cache** — Refresh individuel par source (8 sources) + refresh all

### Cartes feed — visibilité globale

Stockée dans `CachedConfig` avec key `cartes_global_visibility` (JSON).

| Carte | Key | TTL Cache | Source |
|-------|-----|-----------|--------|
| Le Saviez-vous | `saviezVous` | — | Wikipedia archives (static facts) |
| Wikipedia Image | `wikipedia` | 30 jours | Wikipedia scraper |
| CNRS News | `cnrs` | 24h | CNRS scraper |
| Radio France | `radioFrance` | 24h | Radio France scraper |
| NEWS | `news` | 24h | FreeNewsAPI |
| Wikimedia | `wikimedia` | — | Wikimedia Commons API |
| Wiki Loves Earth | `wikiloves` (EARTH) | 30 jours | wikilovesearth.org |
| Pixabay | `pixabay` | — | Pixabay API |
| Portail Lexical | `portailLexical` | None | Portail Lexical API (upsert-by-date) |
| Portail Wikipédia | `portailWikipedia` | 7 jours | Wikipedia Portal scraper |
| Proverbe | `proverbe` | — | CachedConfig JSON |
| Citation | `citation` | 24h | Wikiquote scraper |
| Formule 1 | `f1` | 24h | F1 scraper |
| Articles insolites | `insolite` | 24h | Wikipedia Articles insolites scraper |

### Cartes feed — visibilité par utilisateur

Deux couches de visibilité:
- **Par utilisateur**: champs boolean sur `User` model (ex: `saviezVousCardVisible`)
- **Globale**: stockée dans `CachedConfig` key `cartes_global_visibility`
- **Visibilité finale** = `userVisibility && globalVisibility`

Champs `User`:
- `saviezVousCardVisible`, `wikipediaImageCardVisible`, `cnrsNewsEnabled`, `radioFranceCardVisible`
- `imageWikimediaCardVisible`, `imageWikiLovesCardVisible`, `imagePixabayCardVisible`
- `imageWikimediaShowCategories`, `imageWikiLovesShowCategories`, `imagePixabayShowCategories`, `imagePixabayActiveCategory`
- `portailLexicalCardVisible`, `portailWikipediaCardVisible`, `proverbeCardVisible`
- `newsCardVisible`, `f1CardVisible`, `citationCardVisible`, `insoliteCardVisible`
- `cardNavBarEnabled`

### Card ordering

Ordre des cartes configurable par utilisateur via `cardOrder` JSON field sur `User` model.
Fonctionne via `/api/user-card-order` (GET/POST).
Fallback: `CARD_DEFAULT_ORDER` constant (14 cartes).
Accessible dans `/mon-compte` avec drag-to-reorder.

### Nettoyage

Le cleanup supprime les items expirés de la DB (9 cache models):

| Modèle | Condition d'expiration |
|--------|----------------------|
| `CachedCnrsArticle` | `expiresAt < now` |
| `CachedRadioEpisode` | `expiresAt < now` |
| `CachedWikipediaImage` | `expiresAt < now` |
| `CachedWikiLovesImage` | `expiresAt < now` |
| `CachedNewsArticle` | `expiresAt < now` |
| `CachedF1Article` | `expiresAt < now` |
| `CachedWikipediaPortalArticle` | `expiresAt < now` |
| `CachedCitationArticle` | `expiresAt < now` |
| `CachedInsoliteArticle` | `expiresAt < now` |

**Non-cache models** (pas d'expiration):
- `SaviezVousFact` — static facts, no TTL
- `PortailLexicalMotDuJour` — upsert-by-date (unique on `date`)
- `CachedConfig` — proverbes stored as JSON

Définir un admin :
```bash
echo "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your@email.com';" | npx prisma db execute --url "file:./dev.db" --stdin
```

Vérifier les rôles :
```bash
sqlite3 dev.db "SELECT email, role FROM \"User\";"
```

## Scripts utilitaires

### `scripts/change-password.ts`

Change le mot de passe d'un utilisateur par email.

```bash
npx tsx scripts/change-password.ts <email> <nouveau-mot-de-passe>
```

Exemple :
```bash
npx tsx scripts/change-password.ts admin@example.com MyNewPassword123
```

### `scripts/rename-ideas.ts`

Renomme massivement les idées génériques (Définition, Nature, Origine) en titres descriptifs via LLM. Reprend depuis un checkpoint en cas d'interruption.

```bash
npx tsx scripts/rename-ideas.ts
```

### `scripts/scrape-saviez-vous.ts`

Scrap les archives "Le saviez-vous ?" de Wikipédia (2016-2025).

```bash
npx tsx scripts/scrape-saviez-vous.ts
```

### `scripts/cache-cnrs.ts`

Scrap et met en cache les articles CNRS (TTL: 24h).

```bash
npx tsx scripts/cache-cnrs.ts
```

### `scripts/cache-radio-france.ts`

Scrap et met en cache les épisodes Radio France (TTL: 24h).

```bash
npx tsx scripts/cache-radio-france.ts
```

### `scripts/cache-wikipedia-image.ts`

Scrap et met en cache les images Wikipédia (TTL: 30 jours).

```bash
npx tsx scripts/cache-wikipedia-image.ts
```

### `scripts/scrape-wikiloves.ts`

Scrap et met en cache les images Wiki Loves (TTL: 30 jours).

```bash
npx tsx scripts/scrape-wikiloves.ts
```

Sources:
- Wiki Loves Earth: `https://wikilovesearth.org/category/best/`
- Wiki Loves Monuments: `https://www.wikilovesmonuments.org/galleries/`

### `scripts/fetch-proverbes.ts`

Récupère les proverbes depuis Wiktionary (pages Annexe + catégories). Affiche le nombre de proverbes par page et le total cumulé pendant le fetch.

```bash
# Démarrer le dev server d'abord
npm run dev

# Puis exécuter le script
npm run fetch-proverbes
```

Fetch 14 pages Annexe + 10 catégories de proverbes. Filtrage automatique : seuls les proverbes avec une page Wiktionnaire en français sont conservés.

### `scripts/insert_saviez_vous.ts`

Réinsère les faits "Le saviez-vous" hardcodés.

```bash
npx tsx scripts/insert_saviez_vous.ts
```

### `scripts/update`

Pipeline complet de mise à jour :

```bash
./scripts/update le-saviez-vous  # Réinsérer faits hardcodés
./scripts/update scrape           # Scraper uniquement
./scripts/update ideas            # Générer idées via LLM
./scripts/update ingest           # Ingestion Wikipédia
./scripts/update enhance          # Améliorer contenu court des idées
./scripts/update all              # Pipeline complet (scrape + ideas + ingest)
./scripts/update seed             # Seed topics + idées manuelles
```

### `scripts/deploy.sh`

Script de déploiement sur serveur distant.

### `scripts/install.sh`

Script d'installation automatisée.

## Structure des composants

```
src/components/
├── feed/
│   ├── base-image-card.tsx              # Composant base pour cartes images
│   ├── swipe-background-card.tsx        # Base swipe card
│   ├── saviez-vous-card.tsx             # Carte "Le saviez-vous"
│   ├── wikipedia-image-card.tsx         # Carte image Wikipédia
│   ├── cnrs-news-card.tsx               # Carte actualités CNRS
│   ├── radio-france-card.tsx            # Carte Radio France
│   ├── image-wikimedia-card.tsx         # Carte Wikimedia Commons
│   ├── image-wikiloves-card.tsx         # Carte Wiki Loves
│   ├── image-pixabay-card.tsx           # Carte vidéos Pixabay
│   ├── portail-lexical-card.tsx         # Carte Portail Lexical
│   ├── portail-wikipedia-card.tsx       # Carte Portail Wikipédia
│   ├── proverbe-card.tsx                # Carte proverbe
│   ├── f1-card.tsx                      # Carte Formule 1
│   ├── citation-card.tsx                # Carte Citation Wikiquote
│   ├── news-card.tsx                    # Carte NEWS
│   ├── insolite-card.tsx                # Carte Articles insolites
│   ├── idea-card.tsx                    # Carte d'idée (full + compact)
│   ├── swipeable-idea-detail.tsx        # Détail swipeable (mobile)
│   ├── feed.tsx                         # Feed avec infinite scroll
│   ├── card-visibility-guard.tsx        # Wrapper show/hide (hydration-safe)
│   ├── card-nav-bar.tsx                 # Fixed top bar, IntersectionObserver
│   ├── visibility-button.tsx            # Button for hidden cards (9 color variants)
│   ├── paginated-favorites-list.tsx     # Generic paginated favorites (PAGE_SIZE=10)
│   ├── use-item-share.ts                # Share functionality hook
│   ├── use-auto-refresh.ts              # Periodic data reload hook
│   ├── share-button.tsx                 # Standalone share button
│   └── cnrs-bookmarks.tsx               # CNRS favorites component
├── lobby/
│   └── share-to-lobby-button.tsx        # Share to lobby button
├── layout/
│   ├── navbar.tsx                       # Navigation desktop
│   ├── bottom-nav.tsx                   # Navigation mobile
│   └── theme-toggle.tsx                 # Toggle dark/light mode
├── search/
│   └── search-bar.tsx                   # Recherche avec autocomplétion
├── topics/
│   ├── topic-grid.tsx                   # Grille des topics
│   └── topic-card.tsx                   # Carte de topic
├── splash/
│   └── splash.tsx                       # Onboarding splash screen
└── ui/                                  # Composants shadcn/ui
```

## Cartes feed — layout variants

`CardShell` accepte 4 props de layout pour customiser l'apparence:

| Prop | Type | Défaut | Valeurs |
|------|------|--------|---------|
| `shape` | `CardShape` | `'round'` | `'square'`, `'slight'`, `'default'`, `'round'`, `'pill'` |
| `borderStyle` | `CardBorderStyle` | `'medium'` | `'none'`, `'thin'`, `'medium'`, `'thick'`, `'dashed'`, `'dotted'`, `'double'` |
| `shadow` | `CardShadow` | `'md'` | `'none'`, `'sm'`, `'default'`, `'md'`, `'lg'`, `'xl'`, `'2xl'`, `'inner'` |
| `compact` | `CardCompact` | `'default'` | `'default'`, `'compact'`, `'tight'` |

### Shape (rayon de bordure)

| Valeur | Classe |
|--------|--------|
| `square` | `rounded-none` |
| `slight` | `rounded-sm` |
| `default` | `rounded-lg` |
| `round` | `rounded-xl` |
| `pill` | `rounded-2xl` |

### Border (style de bordure)

| Valeur | Classe |
|--------|--------|
| `none` | — |
| `thin` | `border` (1px) |
| `medium` | `border-2` (2px) |
| `thick` | `border-4` (4px) |
| `dashed` | `border-2 border-dashed` |
| `dotted` | `border-2 border-dotted` |
| `double` | `border-4 border-double` |

### Shadow (ombre)

Tous les shadows utilisent une couleur explicite: noir (light) / blanc (dark). La taille croît au hover.

| Valeur | Classe base |
|--------|------------|
| `none` | `shadow-none` |
| `sm` | `shadow-sm` → hover `shadow-md` |
| `default` | `shadow` → hover `shadow-md` |
| `md` | `shadow-md` → hover `shadow-lg` |
| `lg` | `shadow-lg` → hover `shadow-xl` |
| `xl` | `shadow-xl` → hover `shadow-2xl` |
| `2xl` | `shadow-2xl` |
| `inner` | `shadow-inner` |

### Compact (densité de padding)

| Valeur | Classe |
|--------|--------|
| `default` | `p-3 sm:p-5` |
| `compact` | `p-2 sm:p-3` |
| `tight` | `p-1.5 sm:p-2` |

Mode compact sur `CardHeader`: réduit tailles d'icône (`h-5`), titre (`text-xs`), marge (`mb-2`).

### Exemples

```tsx
// Carré, bordure fine, compact
<CardShell color="green" shape="square" borderStyle="thin" compact="compact">

// Pill, bordure pointillée, grosse ombre
<CardShell color="amber" shape="pill" borderStyle="dotted" shadow="lg">
```

### Tester

`/test-layouts` — page de prévisualisation de tous les variants.

## Structure des scripts

```
src/scripts/
├── seed-ideas.ts                    # 148+ idées manuelles
├── generate-ideas.ts                # Génération LLM par topic
├── ingest-wikipedia.ts              # Ingestion massive Wikipédia
├── enhance-ideas.ts                 # Amélioration contenu court des idées
├── rename-ideas.ts                  # Renommage massif des idées via LLM
├── fetch-proverbes.ts               # Récupération proverbes Wiktionary
├── scrape-saviez-vous.ts            # Scrap archives Le saviez-vous Wikipédia
├── cache-cnrs.ts                    # Cache articles CNRS (TTL: 24h)
├── cache-radio-france.ts            # Cache épisodes Radio France (TTL: 24h)
├── cache-wikipedia-image.ts         # Cache images Wikipédia (TTL: 30 jours)
├── scrape-wikiloves.ts              # Cache images Wiki Loves (TTL: 30 jours)
├── cache-news.ts                    # Cache actualités NEWS (TTL: 24h)
├── cache-f1.ts                      # Cache articles F1 (TTL: 24h)
├── cache-portail-wikipedia.ts       # Cache articles Portail Wikipédia (TTL: 7 jours)
├── cache-citation.ts                # Cache citations Wikiquote (TTL: 24h)
├── cache-portail-lexical.ts         # Mot du jour Portail Lexical (upsert-by-date)
├── cache-saviez-vous-images.ts      # Cache images Le saviez-vous
├── cache-portail-lexical.test.ts    # Tests portail lexical
├── cache-insolite.ts                # Cache Articles insolites (TTL: 24h)
└── cleanup-cached.ts                # Nettoyage items expirés
```

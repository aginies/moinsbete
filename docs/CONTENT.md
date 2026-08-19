# Contenu

## Modèles de base de données

| Modèle | Description |
|--------|-------------|
| **User** | Utilisateurs (email, hash mot de passe, role: USER/ADMIN, enabled, lastLogin, lastVisited, card visibility booleans, cardOrder JSON) |
| **Topic** | Sujets de connaissance |
| **Source** | Sources (Wikipédia, livres, articles, podcasts) |
| **Idea** | Idées bite-sized (titre, contenu, takeaway) |
| **IdeaTopic** | Junction Idea ↔ Topic (1 par idée) |
| **Bookmark** | Bookmarks utilisateur (easeFactor, reviewCount, nextReviewAt) |
| **Collection** | Curated idea collections |
| **GrowthPlan** | Plan d'apprentissage (streak, dernière activité) |
| **TopicSuggestion** | Suggestions de nouveaux topics (admin) |
| **SharedLobbyBookmark** | Favoris partagés dans le lobby |
| **CachedConfig** | Config cachée (proverbes JSON, global card visibility, card order) |
| **CachedCnrsArticle** | Articles CNRS en cache (TTL: 24h) |
| **CachedRadioEpisode** | Épisodes Radio France en cache (TTL: 24h) |
| **CachedWikipediaImage** | Images Wikipédia en cache (TTL: 30 jours) |
| **CachedWikiLovesImage** | Images Wiki Loves en cache (TTL: 30 jours, source: MONUMENTS/EARTH) |
| **CachedNewsArticle** | Actualités NEWS en cache (TTL: 24h, source: FreeNewsAPI) |
| **CachedF1Article** | Articles F1 en cache (TTL: 24h) |
| **CachedWikipediaPortalArticle** | Articles Portail Wikipédia en cache (TTL: 7 jours) |
| **CachedCitationArticle** | Citations Wikiquote en cache (TTL: 24h) |
| **CachedInsoliteArticle** | Articles insolites en cache (TTL: 24h) |
| **CachedApodImage** | Images NASA APOD en cache (TTL: 30 jours, `titleFr`/`explanationFr` traduits via MyMemory) |
| **CachedAirCrashArticle** | Épisodes Air Crash Investigation en cache (TTL: 7 jours, `asnUrl` lien Fiche ASN) |
| **UserWikimediaTopic** | Catégories Wikimedia actives par utilisateur |
| **UserWikiLovesTopic** | Catégories Wiki Loves actives par utilisateur |
| **SaviezVousFact** | Faits "Le saviez-vous" (static, no TTL) |
| **PortailLexicalMotDuJour** | Mot du jour Portail Lexical (date unique, no TTL) |
| **Proverbe** | Proverbes stockés dans CachedConfig comme JSON |
| **SourceTopic** | Junction Source ↔ Topic |
| **ViewedIdea** | Idées vues par utilisateur |
| **PasswordResetToken** | Tokens de réinitialisation mot de passe |
| **UserSuggestion** | Suggestions utilisateur |
| **SuggestionComment** | Commentaires sur suggestions utilisateur |

## Topics disponibles

- 🧠 Psychologie, 🏛️ Philosophie, 🔬 Sciences cognitives
- 💰 Économie, 🗣️ Communication, ⚡ Productivité
- 🧘 Santé & Bien-être, 💡 Créativité, 👑 Leadership
- 📜 Histoire, 🚗 Voitures
- 💰 Finance & Argent, 💻 Technologie & Innovation
- 👥 Sociologie, ⚛️ Physique
- 🍳 Cuisine & Alimentation, 🧬 Biologie & Évolution
- 🔢 Mathématiques, 🎨 Art & Design, 🎤 Débat & Rhétorique
- 💪 En forme 40+, 📰 Actualités NEWS
- 🏎️ Formule 1

## Remplir la base de données

Séquence pour peupler la DB :

```bash
# Étape 1: Créer les topics (21 sujets)
npx tsx prisma/seed.ts

# Étape 2: Idées manuelles (148+ idées bite-sized)
npx tsx src/scripts/seed-ideas.ts

# Étape 3: Idées LLM (~1380 idées, 60 par topic)
npx tsx src/scripts/generate-ideas.ts

# Étape 4: Idées depuis Wikipédia (~890 idées + 183 sources)
npx tsx src/scripts/ingest-wikipedia.ts

# Étape 5: Faits "Le saviez-vous ?"
./scripts/update le-saviez-vous

# Étape 6: Cache sources externes (16 étapes, voir section ci-dessous)
npm run cache:all            # Rapide : CNRS, Radio, Wiki FR, News, cleanup
npx tsx src/scripts/run-cron.ts  # Complet : 11 scripts + cleanup (CNRS, Radio, News, Wiki FR/EN, F1, Citation, Portail Wiki, Lexical, Saviez-vous images, Insolite)
# Ou cron API : curl -H "x-cron-token: $CRON_SECRET" http://localhost:3000/api/cron/cache

# Étape 7: Proverbes depuis Wiktionary
npm run fetch-proverbes

# Étape 8: Images Wiki Loves (manuel uniquement)
npx tsx src/scripts/scrape-wikiloves.ts
```

**Prérequis**: `OPENROUTER_API_KEY` ou `LLM_API_KEY` dans `.env` pour étapes 3 et 4.

## Génération de contenu

**3 pipelines de contenu :**

### 1. Seed manuel (`src/scripts/seed-ideas.ts`)

148+ idées écrites à la main, format bite-sized (titre + contenu + takeaway).

```bash
npx tsx src/scripts/seed-ideas.ts
```

Ajouter une idée dans `IDEAS` :
```ts
{
  title: "Titre de l'idée",
  content: "Explication détaillée...",
  takeaway: "Actionnable: faire ceci...",
  sourceTitle: "Source Wikipédia",
  topicNames: ['Psychologie']
}
```

### 2. Génération LLM (`src/scripts/generate-ideas.ts`)

Fetch Wikipédia → LLM distille ~60 idées/topic → création automatique (~1380 idées).

**Prérequis**: Variable `OPENROUTER_API_KEY` ou `LLM_API_KEY` définie dans `.env`.

```bash
# Pipeline 1: Génération LLM par topic
npx tsx src/scripts/generate-ideas.ts
# Résultat: ~1380 idées supplémentaires (60 par topic)

# Pipeline 2: Ingestion Wikipédia à grande échelle
npx tsx src/scripts/ingest-wikipedia.ts
# Résultat: ~890 idées + 183 sources
```

**Configuration LLM**:
```env
LLM_API_KEY=secret
LLM_BASE_URL=https://votre-api-llm:port/v1
LLM_MODEL=qwen3.6
```

### 3. Scraper "Le saviez-vous ?" (`scripts/scrape-saviez-vous.ts`)

Scrap automatiquement les archives de Wikipédia (2016-2025) :
- Fetch les pages d'archives
- Parse le wikitext brut pour extraire chaque fait
- Insère incrémentalement (skip duplicates)
- Extrait le lien article pour la source URL

```bash
# Scraper les archives Wikipédia
npx tsx src/scripts/scrape-saviez-vous.ts

# Réinsérer les faits hardcodés
npx tsx scripts/insert_saviez_vous.ts

# Ou directement
./scripts/update scrape
./scripts/update le-saviez-vous
./scripts/update ideas
./scripts/update ingest
./scripts/update all
./scripts/update seed
```

### 4. Amélioration de contenu (`src/scripts/enhance-ideas.ts`)

Étend le contenu court des idées à 500+ caractères via LLM.

```bash
./scripts/update enhance
```

### 5. Cache sources externes

| Script | Source | Modèle DB | TTL | npm script | Cron ? |
|--------|--------|-----------|-----|-----------|--------|
| `cache-cnrs.ts` | cnrs.fr/newsroom | `CachedCnrsArticle` | 24h | `cache:cnrs` | Step 1 |
| `cache-radio-france.ts` | radiofrance.fr/franceculture | `CachedRadioEpisode` | 24h | `cache:radio` | Step 2 |
| `cache-news.ts` | freenewsapi.io (14 catégories) | `CachedNewsArticle` | 48h | `cache:news` | Step 3 |
| `cache-wikipedia-image.ts` | fr.wikipedia.org Image du Jour | `CachedWikipediaImage` (lang: fr) | 30j | `cache:wikipedia` | Step 4 |
| `cache-wikipedia-image-en.ts` | en.wikipedia.org Picture of the Day | `CachedWikipediaImage` (lang: en) | 30j | — | Step 5 |
| `cache-f1.ts` | Portail:F1 + fia.com (actualités, image, classement, saviez, fia) | `CachedF1Article` | 24h image / 7j contenu | — | Step 6 |
| `cache-portail-wikipedia.ts` | Contenus de qualité / Bons contenus | `CachedWikipediaPortalArticle` | 7j | — | Step 7 |
| `cache-citation.ts` | fr.wikiquote.org (thèmes, auteurs) | `CachedCitationArticle` | 24h | — | Step 8 |
| `cache-insolite.ts` | Articles insolites Wikipédia | `CachedInsoliteArticle` | 24h | `cache:insolite` | Step 10 |
| `cache-saviez-vous-images.ts` | Résolution images Wikimedia pour faits | `SaviezVousFact.imageFilename` | None | — | Step 12 |
| `cache-portail-lexical.ts` | Mot du jour Portail Lexical | `PortailLexicalMotDuJour` | None (upsert-by-date) | `cache:portail-lexical` | Step 13 |
| `scrape-wikiloves.ts` | Wiki Loves Monuments + Earth | `CachedWikiLovesImage` | 30j | — | Step 9 |
| `cache-apod.ts` | api.nasa.gov APOD (+ traduction EN→FR MyMemory) | `CachedApodImage` | 30j | `cache:apod` | Step 14 |
| `cache-air-crash.ts` | Wikipédia Air Crash Investigation (tableaux d'épisodes) | `CachedAirCrashArticle` | 7j | — | Step 15 |
| `cache-air-crash-asn.ts` | Matching incidents ASN (infobox → recherche ASN) | `CachedAirCrashArticle.asnUrl` | — | — | Step 16 |
| `fetch-proverbes.ts` | Wiktionary proverbes → API `/api/proverbes` | `CachedConfig` (key: `proverbes_all`, JSON) | None | `fetch-proverbes` | Non (manuel) |

**Mode d'exécution :**

```bash
# Rapide : CNRS + Radio + Wiki FR + News + cleanup
npm run cache:all

# Local complet : 11 scripts + cleanup (CNRS, Radio, News, Wiki FR/EN, Saviez-vous images, F1, Citation, Portail Wiki, Lexical, Insolite)
npx tsx src/scripts/run-cron.ts

# Cron API complet : 16 étapes + cleanup (11 modèles)
# Auth: token (?token= ou x-cron-token header) ou IP whitelist
curl -H "x-cron-token: $CRON_SECRET" http://localhost:3000/api/cron/cache

# Individuellement
npm run cache:cnrs
npm run cache:radio
npm run cache:wikipedia
npm run cache:news
npm run cache:insolite
npm run cache:insolite:enrich   # insolite avec enrichissement complet images
npm run cache:portail-lexical
npm run cache:apod
npm run fetch-proverbes
npx tsx src/scripts/cache-wikipedia-image-en.ts
npx tsx src/scripts/cache-f1.ts
npx tsx src/scripts/cache-portail-wikipedia.ts
npx tsx src/scripts/cache-citation.ts
npx tsx src/scripts/cache-air-crash.ts
npx tsx src/scripts/cache-air-crash-asn.ts
npx tsx src/scripts/scrape-wikiloves.ts

# Nettoyer les items expirés (11 modèles)
npm run cache:cleanup

# Décoder les entités HTML résiduelles dans les caches (ex: &#39;)
npm run db:cleanup-entities            # --dry-run pour prévisualiser
```

**Ordre du cron** (`/api/cron/cache`, 16 étapes séquentielles) :

```
Step  1/16:  CNRS
Step  2/16:  Radio France
Step  3/16:  News (freenewsapi.io)
Step  4/16:  Wikipedia Image FR
Step  5/16:  Wikipedia Image EN
Step  6/16:  F1
Step  7/16:  Portail Wikipédia
Step  8/16:  Wikiquote (citation)
Step  9/16:  Wiki Loves
Step 10/16:  Articles insolites
Step 11/16:  Cleanup (11 modèles expirés + news max-age 5j)
Step 12/16:  Saviez-vous images
Step 13/16:  Portail Lexical (WOTD)
Step 14/16:  APOD (NASA, + traduction FR MyMemory)
Step 15/16:  Air Crash Investigation
Step 16/16:  Air Crash ASN matching (liens Fiche ASN)
```

**Différences entre modes :**

| | `npm run cache:all` | `run-cron.ts` | `/api/cron/cache` |
|---|---|---|---|
| Étapes | 5 | 11 + cleanup | 16 + cleanup |
| Wiki EN | non | oui | oui |
| Portail Wiki | non | oui | oui |
| Insolite | non | oui | oui |
| Saviez-vous images | non | oui | oui |
| Cleanup | oui | oui | oui (step 11) |
| Lexical | non | oui | oui |
| Wikiloves | non | non | oui (step 9) |
| APOD | non | non | oui (step 14) |
| Air Crash | non | non | oui (steps 15-16) |
| Proverbes | non | non | non (manuel) |

## Ajouter de nouveaux articles Wikipédia

Éditer `src/scripts/ingest-wikipedia.ts` → `ARTICLES_TO_INGEST` :

```ts
const ARTICLES_TO_INGEST = [
  'Article1',
  'Article2',
  // ... ajouter des articles français de Wikipédia
]
```

Chaque article sera traité ainsi :
1. Fetch résumé depuis Wikipédia API
2. Extraction des catégories (ignore métadonnées)
3. Classification LLM pour assigner au bon topic
4. Distillation de 3 idées par article
5. Création d'une Source Wikipédia

## Ajouter un nouveau topic

1. Éditer `prisma/seed.ts` → tableau `ROOT_TOPICS` :
```ts
{ name: 'Nouveau Sujet', icon: '🎯', color: '#ff6b35', description: '...' }
```

2. Ajouter au moins 10 idées dans `seed-ideas.ts` ou `generate-ideas.ts`

3. Exécuter :
```bash
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts
```

## Bookmark system

**Factory pattern** (standard):
- `createBookmarkManager(type, mapMeta)` in `src/lib/bookmark-manager.ts`
- `createBookmarkActions(libManager)` in `src/actions/bookmark-manager.ts`
- Each source exports `{source}Manager`, `get{Source}Favorites`, `get{Source}FavoritesCount`
- `mapMeta` transforms DB `meta` JSON + `resourceId` into typed doc

**Simple pattern** (single-item cards):
- `useSimpleBookmarkToggle` hook from `@/hooks/use-bookmark-toggle`
- `toggleBookmarkAction` from `@/actions/bookmark-actions`
- Used by: portail lexical, proverbe (partial)

## Favorites

- `PaginatedFavoritesList<T>` generic component (PAGE_SIZE=10)
- `useFavoritesList` hook
- 16 tabs in favoris page (idees + 15 sources), sorted by count descending
- Raw SQL `GROUP BY type` for counts in server component
- Optimistic updates via `handleXxxRemove` callbacks
- Accent normalization for search across all tabs

# Contenu

## Modèles de base de données

| Modèle | Description |
|--------|-------------|
| **User** | Utilisateurs (email, hash mot de passe, role: USER/ADMIN, enabled, lastLogin, lastVisited, card visibility booleans, cardOrder JSON) |
| **Topic** | Sujets de connaissance |
| **Source** | Sources (Wikipédia, livres, articles, podcasts) |
| **Idea** | Idées bite-sized (titre, contenu, takeaway) |
| **IdeaTopic** | Junction Idea ↔ Topic (1 par idée) |
| **Bookmark** | Bookmarks utilisateur (SRS fields: easeFactor, reviewCount, nextReviewAt) |
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

# Étape 6: Proverbes depuis Wiktionary
npm run fetch-proverbes

# Étape 7: Cache sources externes
npm run cache:all
npx tsx src/scripts/scrape-wikiloves.ts
npx tsx src/scripts/cache-news.ts
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

| Script | Source | TTL | Fréquence recommandée |
|--------|--------|-----|----------------------|
| `cache-cnrs.ts` | Articles CNRS | 24h | Quotidien |
| `cache-radio-france.ts` | Épisodes Radio France | 24h | Quotidien |
| `cache-wikipedia-image.ts` | Images Wikipédia | 30 jours | Mensuel |
| `scrape-wikiloves.ts` | Images Wiki Loves | 30 jours | Mensuel |
| `cache-news.ts` | Actualités NEWS (FreeNewsAPI) | 24h | 5x/jour (6h, 12h, 15h, 16h, 21h) |
| `cache-f1.ts` | Articles Formule 1 | 24h | Quotidien |
| `cache-portail-wikipedia.ts` | Articles Portail Wikipédia | 7 jours | Quotidien |
| `cache-citation.ts` | Citations Wikiquote | 24h | Quotidien |
| `cache-portail-lexical.ts` | Mot du jour Portail Lexical | None (upsert-by-date) | Quotidien |
| `cache-saviez-vous-images.ts` | Images Le saviez-vous | None (static) | Quotidien |

`npm run cache:all` lance cache-cnrs, cache-radio-france, cache-wikipedia-image + cleanup (pas scrape-wikiloves, pas cache-news).

Cron `/api/cron/cache` (10 étapes séquentielles):
1. CNRS → 2. Radio France → 3. News → 4. Wikipedia Image → 5. F1 → 6. Portail Wikipédia → 7. Wikiquote → 8. Cleanup (8 cache models) → 9. Saviez-vous → 10. Portail Lexical (WOTD)

```bash
# Lancer tous les caches (sans wikiloves, sans news)
npm run cache:all

# Ou individuellement
npx tsx src/scripts/cache-cnrs.ts
npx tsx src/scripts/cache-radio-france.ts
npx tsx src/scripts/cache-wikipedia-image.ts
npx tsx src/scripts/scrape-wikiloves.ts
npx tsx src/scripts/cache-news.ts
npx tsx src/scripts/cache-f1.ts
npx tsx src/scripts/cache-portail-wikipedia.ts
npx tsx src/scripts/cache-citation.ts
npx tsx src/scripts/cache-portail-lexical.ts
npx tsx src/scripts/cache-saviez-vous-images.ts

# Nettoyer les items expirés
npx tsx src/scripts/cleanup-cached.ts
```

### 6. Proverbes

```bash
# Récupérer les proverbes depuis Wiktionary
npm run fetch-proverbes
```

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
- 14 tabs in favoris page, sorted by count descending
- Raw SQL `GROUP BY type` for counts in server component
- Optimistic updates via `handleXxxRemove` callbacks
- Accent normalization for search across all tabs

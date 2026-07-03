# Contenu

## Modèles de base de données

| Modèle | Description |
|--------|-------------|
| **User** | Utilisateurs (email, hash mot de passe, role: USER/ADMIN) |
| **Topic** | Sujets de connaissance (23 topics, hiérarchie parent/enfant) |
| **Source** | Sources (Wikipédia, livres, articles, podcasts) |
| **Idea** | Idées bite-sized (titre, contenu, takeaway, image source) | 736 |
| **IdeaTopic** | Junction Idea ↔ Topic (1 par idée) | 736 |
| **Bookmark** | Bookmarks utilisateur |
| **Collection** | Collections d'idées |
| **GrowthPlan** | Plan d'apprentissage (streak, dernière activité) |
| **TopicSuggestion** | Suggestions de nouveaux topics (admin) |
| **CommunityArticle** | Articles communautaires |

## Topics disponibles (20)

- 🧠 Psychologie (20+), 🏛️ Philosophie (15+), 🔬 Sciences cognitives (15+)
- 💰 Économie (15+), 🗣️ Communication (15+), ⚡ Productivité (15+)
- 🧘 Santé & Bien-être (15+), 💡 Créativité (15+), 👑 Leadership (15+)
- 📜 Histoire (20+), 🚗 Voitures (10)
- 💰 Finance & Argent (20+), 💻 Technologie & Innovation (20+)
- 👥 Sociologie (20+), ⚛️ Physique (20+)
- 🍳 Cuisine & Alimentation (20+), 🧬 Biologie & Évolution (20+)
- 🔢 Mathématiques (20+), 🎨 Art & Design (20+), 🎤 Débat & Rhétorique (20+)

## Génération de contenu

**3 pipelines de contenu :**

### 1. Seed manuel (`src/scripts/seed-ideas.ts`)

146+ idées écrites à la main, format bite-sized (titre + contenu + takeaway).

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

Fetch Wikipédia → LLM distille 5 idées/article → création automatique (~490 idées).

**Prérequis**: Variable `OPENROUTER_API_KEY` ou `LLM_API_KEY` définie dans `.env`.

```bash
# Pipeline 1: Génération LLM par topic
npx tsx src/scripts/generate-ideas.ts
# Résultat: ~490 idées supplémentaires (20 par topic)

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
npx tsx scripts/scrape-saviez-vous.ts

# Ou directement
./scripts/update scrape
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

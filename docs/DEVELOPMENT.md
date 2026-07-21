# Développement

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
| `/api/card-visibility` | GET | Global card visibility (admin) | — |
| `/api/user-card-visibility` | POST | Toggle user card visibility (CSRF) | — |
| `/api/user-card-order` | GET/POST | Get/set user card order (CSRF) | — |
| `/api/wikimedia-topics` | GET/POST | User wikimedia topics (CSRF) | — |
| `/api/image-wikiloves-topics` | POST | Toggle wiki loves topics (CSRF) | — |
| `/api/topics/suggest` | POST | Suggestion de topic via LLM | 10/min IP |
| `/api/auth/reset-password/generate` | POST | Générer token reset | 3/min IP |
| `/api/auth/reset-password` | POST | Reset mot de passe | 5/min IP |
| `/api/admin/suggestions/[id]/approve` | POST | Approuver suggestion (admin) | — |
| `/api/admin/suggestions/[id]/reject` | POST | Rejeter suggestion (admin) | — |
| `/api/admin/suggestions/[id]/merge` | POST | Fusionner suggestion (admin) | — |
| `/api/lobby` | GET | Shared lobby bookmarks | — |
| `/api/lobby/[id]` | POST/DELETE | Share/unshare to lobby (CSRF) | — |
| `/api/cron/cache` | GET | Cron cache endpoint | — |

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

1. **Stats** — Compteurs par modèle DB + items expirés
2. **Users** — Liste utilisateurs avec toggle enabled/disabled
3. **Cartes** — Toggle global visibility par carte feed
4. **Cleanup** — Suppression des items expirés (avec confirmation)

### Cartes feed — visibilité globale

Stockée dans `CachedConfig` avec key `cartes_global_visibility` (JSON).

| Carte | Key | TTL Cache | Source |
|-------|-----|-----------|--------|
| Le Saviez-vous | `saviezVous` | — | Wikipedia archives |
| Wikipedia Image | `wikipedia` | 30 jours | Wikipedia scraper |
| CNRS News | `cnrs` | 24h | CNRS scraper |
| Radio France | `radioFrance` | 24h | Radio France scraper |
| Wikimedia | `wikimedia` | — | Wikimedia Commons API |
| Wiki Loves Earth | `wikiloves` (EARTH) | 30 jours | wikilovesearth.org |
| Wiki Loves Monuments | `wikiloves` (MONUMENTS) | 30 jours | wikilovesmonuments.org |
| Pixabay | `pixabay` | — | Pixabay API |
| Portail Lexical | `portailLexical` | — | Wiktionary API |
| Proverbe | `proverbe` | — | Wiktionary API |

### Cartes feed — visibilité par utilisateur

Chaque utilisateur a ses propres préférences stockées dans le modèle `User`:

- `saviezVousCardVisible`, `wikipediaImageCardVisible`, `cnrsNewsEnabled`, `radioFranceCardVisible`
- `imageWikimediaCardVisible`, `imageWikiLovesCardVisible`, `imagePixabayCardVisible`
- `portailLexicalCardVisible`, `proverbeCardVisible`

Visibilité finale = `userVisibility && globalVisibility`.

### Card ordering

Ordre des cartes configurable par utilisateur via `cachedConfig` key `card_order_{userId}`.
Accessible dans `/mon-compte` avec drag-to-reorder.

### Nettoyage

Le cleanup supprime les items expirés de la DB:

| Modèle | Condition d'expiration |
|--------|----------------------|
| `CachedCnrsArticle` | `expiresAt < now` |
| `CachedRadioEpisode` | `expiresAt < now` |
| `CachedWikipediaImage` | `expiresAt < now` |
| `CachedWikiLovesImage` | `expiresAt < now` |

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
│   ├── base-image-card.tsx      # Composant base pour cartes images (Wikimedia, Wiki Loves, Pixabay)
│   ├── saviez-vous-card.tsx     # Carte "Le saviez-vous"
│   ├── wikipedia-image-card.tsx # Carte image Wikipédia
│   ├── cnrs-news-card.tsx       # Carte actualités CNRS
│   ├── radio-france-card.tsx    # Carte Radio France
│   ├── image-wikimedia-card.tsx # Carte Wikimedia Commons
│   ├── image-wikiloves-card.tsx # Carte Wiki Loves (cache dédié)
│   ├── image-pixabay-card.tsx   # Carte vidéos Pixabay
│   ├── portail-lexical-card.tsx # Carte Portail Lexical
│   ├── proverbe-card.tsx        # Carte proverbe
│   ├── idea-card.tsx            # Carte d'idée (full + compact)
│   ├── swipeable-idea-detail.tsx # Détail swipeable (mobile)
│   └── feed.tsx                 # Feed avec infinite scroll
├── layout/
│   ├── navbar.tsx               # Navigation desktop
│   ├── bottom-nav.tsx           # Navigation mobile
│   └── theme-toggle.tsx         # Toggle dark/light mode
├── search/
│   └── search-bar.tsx           # Recherche avec autocomplétion
├── topics/
│   ├── topic-grid.tsx           # Grille des topics
│   └── topic-card.tsx           # Carte de topic
└── ui/                          # Composants shadcn/ui
```

## Structure des scripts

```
src/scripts/
├── seed-ideas.ts              # 148+ idées manuelles
├── generate-ideas.ts          # Génération LLM par topic
├── ingest-wikipedia.ts        # Ingestion massive Wikipédia
├── enhance-ideas.ts           # Amélioration contenu court des idées
├── change-password.ts         # Changement mot de passe utilisateur
├── rename-ideas.ts            # Renommage massif des idées via LLM
├── fetch-proverbes.ts         # Récupération proverbes Wiktionary
├── scrape-saviez-vous.ts      # Scrap archives Le saviez-vous Wikipédia
├── cache-cnrs.ts              # Cache articles CNRS (TTL: 24h)
├── cache-radio-france.ts      # Cache épisodes Radio France (TTL: 24h)
├── cache-wikipedia-image.ts   # Cache images Wikipédia (TTL: 30 jours)
├── scrape-wikiloves.ts        # Cache images Wiki Loves (TTL: 30 jours)
└── cleanup-cached.ts          # Nettoyage items expirés
```

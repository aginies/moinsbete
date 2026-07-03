# Développement

## Architecture des pages

```
/                          → Redirection vers /sujets
/sujets                    → Grille des topics + recherche
/sujets/[slug]             → Détail d'un topic + idées associées
/idees/[slug]              → Détail d'une idée
/ma-bibliotheque           → Bookmarks utilisateur (auth requis)
/mon-plan                  → Plan d'apprentissage (auth requis)
/login                     → Connexion
/register                  → Inscription
/admin                     → Dashboard admin
```

## API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/feed` | GET | Liste des idées (paginé, filtrable par topic) |
| `/api/search?q=` | GET | Recherche dans idées, topics, sources |
| `/api/ideas/[slug]/bookmark` | POST | Toggle bookmark |
| `/api/topics/suggest` | POST | Suggestion de topic (admin) |

## Ajouter un nouveau topic

1. Ajouter dans `src/scripts/seed-ideas.ts` → `ROOT_TOPICS` :
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

Définir un admin :
```bash
echo "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your@email.com';" | npx prisma db execute --url "file:./dev.db" --stdin
```

Vérifier les rôles :
```bash
sqlite3 dev.db "SELECT email, role FROM \"User\";"
```

## Scripts utilitaires

### `scripts/scrape-saviez-vous.ts`

Scrap les archives "Le saviez-vous ?" de Wikipédia (2016-2025).

```bash
npx tsx scripts/scrape-saviez-vous.ts
```

### `scripts/update`

Pipeline complet de mise à jour :

```bash
./scripts/update scrape    # Scraper uniquement
./scripts/update all       # Pipeline complet (scrape + ideas + ingest)
```

## Structure des composants

```
src/components/
├── feed/
│   ├── idea-card.tsx      # Carte d'idée (full + compact)
│   ├── swipeable-idea-detail.tsx  # Détail swipeable (mobile)
│   └── feed.tsx           # Feed avec infinite scroll
├── layout/
│   ├── navbar.tsx         # Navigation desktop
│   ├── bottom-nav.tsx     # Navigation mobile
│   └── theme-toggle.tsx   # Toggle dark/light mode
├── search/
│   └── search-bar.tsx     # Recherche avec autocomplétion
├── topics/
│   ├── topic-grid.tsx     # Grille des topics
│   └── topic-card.tsx     # Carte de topic
└── ui/                    # Composants shadcn/ui
```

## Structure des scripts

```
src/scripts/
├── seed-ideas.ts          # 106+ idées manuelles
├── generate-ideas.ts      # Génération LLM par topic
└── ingest-wikipedia.ts    # Ingestion massive Wikipédia
```

# Développement

## Architecture des pages

```
/                          → Redirection vers /sujets
/sujets                    → Grille des topics + recherche
/sujets/[slug]             → Détail d'un topic + idées associées
/idees/[slug]              → Détail d'une idée
/idees/au-hasard           → Idée aléatoire (option: ?followed=1)
/ma-bibliotheque           → Bookmarks utilisateur (auth requis)
/favoris                   → Favoris / bookmarks (auth requis)
/mon-historique            → Historique de consultation (auth requis)
/mon-compte                → Profil utilisateur (auth requis)
/a-propos                  → Page d'information
/login                     → Connexion
/register                  → Inscription
/admin                     → Dashboard admin
/admin/review/topics       → Review de topics suggérés
```

## API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/feed` | GET | Liste des idées (paginé, filtrable par topic) |
| `/api/search?q=` | GET | Recherche dans idées, topics, sources |
| `/api/ideas/[slug]/bookmark` | POST | Toggle bookmark |
| `/api/ideas/random` | GET | Idée aléatoire |
| `/api/history` | GET/POST | Historique de consultation (auth requis) |
| `/api/saviez-vous` | GET | Fait "Le saviez-vous" aléatoire |
| `/api/auth/reset-password` | POST | Reset mot de passe |
| `/api/auth/reset-password/generate` | POST | Générer token reset |

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
├── seed-ideas.ts          # 148+ idées manuelles
├── generate-ideas.ts      # Génération LLM par topic
├── ingest-wikipedia.ts    # Ingestion massive Wikipédia
├── enhance-ideas.ts       # Amélioration contenu court des idées
├── change-password.ts     # Changement mot de passe utilisateur
└── rename-ideas.ts        # Renommage massif des idées via LLM
```

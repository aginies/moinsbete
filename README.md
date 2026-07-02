# StashFru — Apprentissage rapide en français

Application de découverte de connaissances bite-sized : idées, sujets, sources Wikipédia, bookmarks et plan d'apprentissage.

## Architecture

- **Framework**: Next.js 16 (App Router) + React 19
- **Base de données**: SQLite (fichier local) via Prisma ORM
- **Authentification**: NextAuth v4 (credentials, bcrypt)
- **LLM**: OpenAI-compatible API (pour génération d'idées et ingestion Wikipédia)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Icônes**: Lucide React

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js App Router, React Server Components |
| Backend | API Routes Next.js, Prisma ORM |
| Base de données | SQLite (fichier .db) |
| Authentification | NextAuth v4 + bcrypt |
| Génération de contenu | LLM OpenAI-compatible |
| Ingestion Wikipédia | REST API fr.wikipedia.org |

## Structure du projet

```
stashfru/
├── prisma/
│   ├── schema.prisma          # Modèle de données (9 modèles)
│   ├── migrations/            # Migrations Prisma
│   └── seed.ts                # Création des 23 topics racine
├── src/
│   ├── lib/
│   │   ├── db.ts              # Client Prisma
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── llm.ts             # Client LLM + extraction JSON
│   │   └── utils.ts           # Helpers (slugify, cn)
│   ├── app/
│   │   ├── (main)/            # Pages principales
│   │   │   ├── page.tsx       # Feed d'idées
│   │   │   ├── sujets/       # Page des topics + recherche
│   │   │   ├── idees/[slug]/  # Détail d'une idée
│   │   │   ├── ma-bibliotheque/ # Bookmarks
│   │   │   └── mon-plan/      # Plan d'apprentissage
│   │   ├── (auth)/            # Login / Register
│   │   ├── admin/             # Dashboard admin
│   │   └── api/               # API routes (feed, search, bookmark)
│   ├── components/
│   │   ├── feed/              # IdeaCard, Feed (infinite scroll)
│   │   ├── layout/            # Navbar, BottomNav (mobile), ThemeToggle
│   │   ├── search/            # SearchBar avec autocomplétion
│   │   ├── topics/            # TopicGrid, TopicCard
│   │   └── ui/                # Composants shadcn/ui
│   └── scripts/
│       ├── seed-ideas.ts      # 460+ idées manuelles + LLM
│       ├── generate-ideas.ts  # Génération LLM depuis Wikipédia
│       └── ingest-wikipedia.ts # Ingestion d'articles Wikipédia
├── .env                       # Variables d'environnement (non versionné)
├── prisma.config.ts           # Configuration Prisma v6
└── next.config.ts             # Config Next.js (images remotePatterns)
```

## Données

### Modèles de base de données

| Modèle | Description |
|--------|-------------|
| **User** | Utilisateurs (email, hash mot de passe, bookmarks) |
| **Topic** | Sujets de connaissance (23 topics, hiérarchie parent/enfant) |
| **Source** | Sources (Wikipédia, livres, articles, podcasts) |
| **Idea** | Idées bite-sized (titre, contenu, takeaway, image source) |
| **IdeaTopic** | Junction Idea ↔ Topic |
| **Bookmark** | Bookmarks utilisateur |
| **Collection** | Collections d'idées |
| **GrowthPlan** | Plan d'apprentissage (streak, dernière activité) |
| **TopicSuggestion** | Suggestions de nouveaux topics (admin) |
| **CommunityArticle** | Articles communautaires |

### Topics disponibles (23)

**Thèmes généraux:**
- 🧠 Psychologie, 🏛️ Philosophie, 🔬 Sciences cognitives
- 💰 Économie, 🗣️ Communication, ⚡ Productivité
- 🧘 Santé & Bien-être, 💡 Créativité, 👑 Leadership, 📜 Histoire

**Nouveaux topics:**
- 💰 Finance & Argent (10 manuelles + 10 LLM)
- 💻 Technologie & Innovation (10 manuelles + 10 LLM)
- 👥 Sociologie (10 manuelles + 10 LLM)
- ⚛️ Physique (10 manuelles + 10 LLM)
- 🍳 Cuisine & Alimentation (10 manuelles + 10 LLM)
- 🧬 Biologie & Évolution (10 manuelles + 10 LLM)
- 🔢 Mathématiques (10 manuelles + 10 LLM)
- 🎨 Art & Design (10 manuelles + 10 LLM)
- 🎤 Débat & Rhétorique (10 manuelles + 14 LLM)
- 🚗 Voitures (10 manuelles)

### Génération de contenu

**3 pipelines de contenu:**

1. **Seed manuel** (`src/scripts/seed-ideas.ts`): 460+ idées écrites à la main, format bite-sized (titre + contenu + takeaway)
2. **Génération LLM** (`src/scripts/generate-ideas.ts`): Fetch Wikipédia → LLM distille 5 idées/article → création automatique
3. **Ingestion Wikipédia** (`src/scripts/ingest-wikipedia.ts`): Articles Wikipédia → catégories → LLM classification → création de sources + idées

## Installation

### Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 10

### Étapes

```bash
# 1. Cloner le repo
git clone <repo-url>
cd stashfru

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (voir section Configuration)
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer le client Prisma
npx prisma generate

# 5. Appliquer les migrations (crée la base SQLite)
npx prisma migrate deploy

# 6. Seed initial (topics + idées manuelles)
npm run db:seed

# 7. Lancer le serveur de développement
npm run dev
```

## Configuration

### Variables d'environnement (.env)

Créer un fichier `.env` à la racine avec ces variables:

```env
# Base de données SQLite
DATABASE_URL="file:./dev.db"

# Authentification
NEXTAUTH_SECRET="une-clé-secrète-aléatoire-générer-avec-openssl"
NEXTAUTH_URL="http://localhost:3000"

# LLM (pour génération d'idées et ingestion Wikipédia)
LLM_BASE_URL="https://votre-api-llm:port/v1"
LLM_MODEL="nom-du-modele"
LLM_API_KEY="votre-cle-api"
```

### Génération de NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Configuration LLM

Le LLM doit être compatible avec l'API OpenAI (endpoint `/v1/chat/completions`).

Exemple de configuration:
```env
LLM_BASE_URL="https://100.72.33.21:49222/v1"
LLM_MODEL="qwen3.6"
LLM_API_KEY="secret"
```

**Note:** Si le LLM utilise un certificat auto-signé, définir:
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (localhost:3000) |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm run db:migrate` | Créer une migration de développement |
| `npm run db:seed` | Seed initial (topics + idées) |
| `npm run db:ingest` | Ingestion Wikipédia |
| `npm run db:studio` | Ouvrir Prisma Studio (interface DB) |
| `npm run lint` | ESLint |

## Déploiement

### Option 1: Serveur VPS (recommandé pour SQLite)

```bash
# 1. Configurer un serveur Node.js
# 2. Cloner le repo
git clone <repo-url>
cd stashfru

# 3. Installer les dépendances
npm ci --production

# 4. Générer Prisma
npx prisma generate

# 5. Appliquer les migrations
npx prisma migrate deploy

# 6. Seed (si nouvelle installation)
npm run db:seed

# 7. Build
npm run build

# 8. Démarrer avec PM2
npm install -g pm2
pm2 start npm --name "stashfru" -- start
pm2 save
pm2 startup
```

**Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name stashfru.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Vercel (nécessite migration DB)

Vercel ne supporte pas SQLite nativement. Migrer vers Turso (libSQL Cloud):

```env
# Remplacer DATABASE_URL par:
DATABASE_URL="libsql://your-db.turso.io"
```

Puis déployer:
```bash
# Via CLI Vercel
npx vercel

# Ou via GitHub integration
```

Variables d'environnement à configurer dans Vercel Dashboard:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (https://your-app.vercel.app)
- `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` (optionnel)

### Option 3: Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t stashfru .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="file:/data/dev.db" \
  -e NEXTAUTH_SECRET="secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -v stashfru-data:/data \
  stashfru

docker volume create stashfru-data
```

## Développement

### Ajouter un nouveau topic

1. Ajouter dans `src/scripts/seed-ideas.ts` → `ROOT_TOPICS`:
```ts
{ name: 'Nouveau Sujet', icon: '🎯', color: '#ff6b35', description: 'Description' }
```

2. Ajouter des idées dans `IDEAS`:
```ts
{
  title: "Titre de l'idée",
  content: "Contenu explicatif...",
  takeaway: "Takeaway actionnable...",
  sourceTitle: "Source Wikipédia",
  topicNames: ['Nouveau Sujet']
}
```

3. Exécuter:
```bash
npx prisma db seed
```

### Générer plus d'idées avec le LLM

1. Ajouter le topic à `TOPICS_TO_GENERATE` dans `src/scripts/generate-ideas.ts`
2. Ajouter les articles Wikipédia dans `TOPIC_ARTICLES`
3. Exécuter:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx src/scripts/generate-ideas.ts
```

### Architecture des pages

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

### API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/feed` | GET | Liste des idées (paginé, filtrable par topic) |
| `/api/search?q=` | GET | Recherche dans idées, topics, sources |
| `/api/ideas/[slug]/bookmark` | POST | Toggle bookmark |
| `/api/topics/suggest` | POST | Suggestion de topic (admin) |

## Sécurité

- **Mots de passe**: hashés avec bcrypt (10 rounds)
- **Session**: JWT (NextAuth)
- **Variables sensibles**: `.env` et `dev.db` dans `.gitignore`
- **TLS**: Pour LLM auto-signé, `NODE_TLS_REJECT_UNAUTHORIZED=0` (production: utiliser un certificat valide)

## Dépannage

### LLM ne répond pas

```bash
# Tester la connexion
curl -X POST $LLM_BASE_URL/v1/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"$LLM_MODEL","messages":[{"role":"user","content":"test"}]}'
```

### Base de données corrompue

```bash
# Supprimer et recréer
rm dev.db
npx prisma migrate deploy
npm run db:seed
```

### Erreur Prisma "relationJoins"

```bash
# Vérifier la version de Prisma
npx prisma --version
# Doit être ≥ 6.0.0
```

### Images ne chargent pas

Vérifier `next.config.ts`:
```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'fr.wikipedia.org' },
    { protocol: 'https', hostname: 'upload.wikimedia.org' },
  ],
}
```

## Licence

Private — Tous droits réservés.

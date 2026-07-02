# MoinsBête — Apprentissage rapide en français

Application de découverte de connaissances bite-sized : idées, sujets, sources Wikipédia, bookmarks et plan d'apprentissage.

## Base de données

### Vue d'ensemble

- **Type**: SQLite (fichier unique `dev.db`)
- **ORM**: Prisma v6
- **Fichier**: `dev.db` à la racine du projet (dans `.gitignore`)
- **Emplacement**: `/stashfru/dev.db`

### Statistiques actuelles

| Modèle | Description | Compteur |
|--------|-------------|----------|
| **Idea** | Idées bite-sized (titre + contenu + takeaway) | 736 |
| **Source** | Sources (Wikipédia articles) | 183 |
| **Topic** | Sujets de connaissance | 20 |
| **IdeaTopic** | Association Idea ↔ Topic (1 par idée) | 736 |
| **SaviezVousFact** | Faits "Le saviez-vous" | 4 118 |
| **Collection** | Collections d'idées | 6 |
| **User** | Utilisateurs | variable |
| **Bookmark** | Bookmarks utilisateur | variable |
| **ViewedIdea** | Historique de consultation | variable |

### Gestion de la base de données

#### 1. Initialisation (nouvelle installation)

```bash
# Appliquer les migrations (crée les tables)
npx prisma db push

# Seed initial (20 topics racine)
npx tsx prisma/seed.ts

# Idées manuelles (146 idées pré-écrites)
npx tsx src/scripts/seed-ideas.ts
```

#### 2. Générer du contenu avec le LLM

**Prérequis**: Variable `OPENROUTER_API_KEY` définie dans `.env`

```bash
# Pipeline 1: Génération LLM par topic
# Utilise le résumé Wikipédia + LLM pour créer des idées
npx tsx src/scripts/generate-ideas.ts
# Résultat: ~490 idées supplémentaires (20 par topic)

# Pipeline 2: Ingestion Wikipédia à grande échelle
# Inscrit 295 articles Wikipédia, distille 3 idées/article
npx tsx src/scripts/ingest-wikipedia.ts
# Résultat: ~890 idées + 183 sources
```

**Configuration LLM**:
```env
OPENROUTER_API_KEY=votre-cle-openrouter
# ou
LLM_API_KEY=secret
LLM_BASE_URL=https://votre-api-llm:port/v1
LLM_MODEL=qwen3.6
```

#### 3. Ajouter de nouveaux articles Wikipédia

Éditer `src/scripts/ingest-wikipedia.ts` → `ARTICLES_TO_INGEST`:

```ts
const ARTICLES_TO_INGEST = [
  'Article1',
  'Article2',
  // ... ajouter des articles français de Wikipédia
]
```

Chaque article sera traité ainsi:
1. Fetch résumé depuis Wikipédia API
2. Extraction des catégories (ignore métadonnées)
3. Classification LLM pour assigner au bon topic
4. Distillation de 3 idées par article
5. Création d'une Source Wikipédia

#### 4. Ajouter des idées manuelles

Éditer `src/scripts/seed-ideas.ts` → tableau `IDEAS`:

```ts
{
  title: "Titre de l'idée",
  content: "Explication détaillée...",
  takeaway: "Actionnable: faire ceci...",
  sourceTitle: "Source Wikipédia",
  topicNames: ['Psychologie']
}
```

Puis exécuter:
```bash
npx tsx src/scripts/seed-ideas.ts
```

#### 5. Scraper "Le saviez-vous ?" depuis Wikipédia

Le script `scripts/scrape-saviez-vous.ts` scrap automatiquement les archives de Wikipédia:
- Fetch les pages d'archives (2021-2026)
- Parse le wikitext brut pour extraire chaque fait
- Insère incrémentalement (skip duplicates)
- Extrait le lien article pour la source URL

```bash
# Scraper les archives Wikipédia
./scripts/update scrape

# Ou directement
npx tsx scripts/scrape-saviez-vous.ts
```

#### 6. Ajouter un nouveau topic

1. Éditer `prisma/seed.ts` → tableau `ROOT_TOPICS`:
```ts
{ name: 'Nouveau Sujet', icon: '🎯', color: '#ff6b35', description: '...' }
```

2. Ajouter au moins 10 idées dans `seed-ideas.ts` ou `generate-ideas.ts`

3. Exécuter:
```bash
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts
```

#### 7. Explorer la base de données

```bash
# Interface graphique (recommandé)
npx prisma studio

# Commandes SQLite directes
sqlite3 dev.db ".tables"
sqlite3 dev.db "SELECT COUNT(*) FROM Idea;"
sqlite3 dev.db "SELECT idea.title, topic.name FROM IdeaTopic JOIN Idea ON IdeaTopic.ideaId = Idea.id JOIN Topic ON IdeaTopic.topicId = Topic.id LIMIT 10;"
```

#### 8. Backup

```bash
# Backup simple (copie du fichier)
cp dev.db dev.db.backup

# Backup avec timestamp
cp dev.db "dev.db.$(date +%Y%m%d-%H%M%S).backup"

# Backup compressé
gzip -c dev.db > "dev.db.$(date +%Y%m%d).backup.gz"

# Restaurer
cp dev.db.backup dev.db
# ou
gunzip -c dev.db.20260702.backup.gz > dev.db
```

**Recommandation**: Backup avant chaque ingestion LLM majeure.

#### 9. Nettoyage / Reset

```bash
# Supprimer TOUTES les données (garde la structure)
sqlite3 dev.db "DELETE FROM IdeaTopic; DELETE FROM Idea; DELETE FROM Source; DELETE FROM SaviezVousFact; DELETE FROM Bookmark; DELETE FROM ViewedIdea; DELETE FROM Collection; DELETE FROM CommunityArticle; DELETE FROM GrowthPlan; DELETE FROM PasswordResetToken; DELETE FROM TopicSuggestion; DELETE FROM _CollectionToTopic; DELETE FROM _UserFollowing; DELETE FROM User;"

# Recréer depuis zéro
rm dev.db
npx prisma db push
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts
```

#### 10. Diagnostic

```bash
# Vérifier l'intégrité
sqlite3 dev.db "PRAGMA integrity_check;"

# Voir les idées sans topic
sqlite3 dev.db "SELECT id FROM Idea WHERE id NOT IN (SELECT ideaId FROM IdeaTopic);"

# Voir les topics sans idées
sqlite3 dev.db "SELECT t.name, COUNT(it.id) as ideaCount FROM Topic t LEFT JOIN IdeaTopic it ON t.id = it.topicId GROUP BY t.id HAVING ideaCount = 0;"

# Compteur par topic
sqlite3 dev.db "SELECT t.name, COUNT(it.id) FROM Topic t JOIN IdeaTopic it ON t.id = it.topicId GROUP BY t.name ORDER BY COUNT(it.id) DESC;"
```

#### 11. Workflow typique d'enrichissement

```bash
# 1. Backup
cp dev.db dev.db.backup

# 2. Vérifier les topics avec peu d'idées
sqlite3 dev.db "SELECT t.name, COUNT(it.id) FROM Topic t JOIN IdeaTopic it ON t.id = it.topicId GROUP BY t.name ORDER BY COUNT(it.id) ASC;"

# 3. Ajouter des articles ciblés dans ingest-wikipedia.ts

# 4. Lancer l'ingestion
OPENROUTER_API_KEY=secret npx tsx src/scripts/ingest-wikipedia.ts

# 5. Vérifier les résultats
sqlite3 dev.db "SELECT t.name, COUNT(it.id) FROM Topic t JOIN IdeaTopic it ON t.id = it.topicId GROUP BY t.name ORDER BY COUNT(it.id) DESC;"

# 6. Commit
git add -A && git commit -m "feat: enrich topics with new Wikipedia articles"
```

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
| **Idea** | Idées bite-sized (titre, contenu, takeaway, image source) | 736 |
| **IdeaTopic** | Junction Idea ↔ Topic (1 par idée) | 736 |
| **Bookmark** | Bookmarks utilisateur |
| **Collection** | Collections d'idées |
| **GrowthPlan** | Plan d'apprentissage (streak, dernière activité) |
| **TopicSuggestion** | Suggestions de nouveaux topics (admin) |
| **CommunityArticle** | Articles communautaires |

### Topics disponibles (20)

- 🧠 Psychologie (20+), 🏛️ Philosophie (15+), 🔬 Sciences cognitives (15+)
- 💰 Économie (15+), 🗣️ Communication (15+), ⚡ Productivité (15+)
- 🧘 Santé & Bien-être (15+), 💡 Créativité (15+), 👑 Leadership (15+)
- 📜 Histoire (20+), 🚗 Voitures (10)
- 💰 Finance & Argent (20+), 💻 Technologie & Innovation (20+)
- 👥 Sociologie (20+), ⚛️ Physique (20+)
- 🍳 Cuisine & Alimentation (20+), 🧬 Biologie & Évolution (20+)
- 🔢 Mathématiques (20+), 🎨 Art & Design (20+), 🎤 Débat & Rhétorique (20+)

### Génération de contenu

**3 pipelines de contenu:**

1. **Seed manuel** (`src/scripts/seed-ideas.ts`): 146 idées écrites à la main, format bite-sized (titre + contenu + takeaway)
2. **Génération LLM** (`src/scripts/generate-ideas.ts`): Fetch Wikipédia → LLM distille 5 idées/article → création automatique (~490 idées)
3. **Ingestion Wikipédia** (`src/scripts/ingest-wikipedia.ts`): 295 articles → LLM classification → création de sources + 3 idées/article (~890 idées)

**Commandes:**

```bash
# Seed initial (topics + 146 idées manuelles)
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts

# Génération LLM par topic (nécessite OPENROUTER_API_KEY)
OPENROUTER_API_KEY=secret npx tsx src/scripts/generate-ideas.ts

# Ingestion Wikipédia à grande échelle (nécessite LLM_API_KEY)
LLM_API_KEY=secret npx tsx src/scripts/ingest-wikipedia.ts
```

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
| `npx prisma db push` | Appliquer les migrations sans créer de fichier |
| `npx prisma migrate dev` | Créer une migration de développement |
| `npx prisma studio` | Ouvrir Prisma Studio (interface DB) |
| `npx tsx prisma/seed.ts` | Seed initial (20 topics racine) |
| `npx tsx src/scripts/seed-ideas.ts` | 146 idées manuelles |
| `npx tsx src/scripts/generate-ideas.ts` | Génération LLM par topic |
| `npx tsx src/scripts/ingest-wikipedia.ts` | Ingestion massive Wikipédia |
| `npx tsx scripts/scrape-saviez-vous.ts` | Scraper LS depuis archives Wikipédia |
| `./scripts/update scrape` | Commande raccourcie pour scraper |
| `./scripts/update all` | Pipeline complet (scrape + ideas + ingest) |
| `npm run lint` | ESLint |

## Déploiement sur un serveur Apache

### Prérequis serveur

- **Ubuntu/Debian** avec Apache, Node.js ≥ 20, npm ≥ 10
- **SQLite** (généralement préinstallé)
- Port 3000 libre pour le serveur Next.js

### Étape 1 : Préparer le serveur

```bash
# Installer Node.js 20+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs apache2 sqlite3

# Activer les modules Apache nécessaires
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
sudo systemctl restart apache2
```

### Étape 2 : Cloner et préparer l'application

```bash
# Créer le répertoire d'installation
sudo mkdir -p /srv/http/stashfru
cd /srv/http/stashfru

# Cloner le repo
git clone https://github.com/aginies/deepstash/stashfru .

# Installer les dépendances (production uniquement)
npm ci --production

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

### Étape 3 : Base de données

**Nouvelle installation :**
```bash
# Seed initial (20 topics + 146 idées manuelles)
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts

# Scraper les faits "Le saviez-vous" (optionnel mais recommandé)
npx tsx scripts/scrape-saviez-vous.ts
```

**Avec une base de données existante :**
```bash
# Placer le fichier dev.db dans le répertoire d'installation
sudo cp /chemin/vers/dev.db /srv/http/stashfru/dev.db

# Vérifier l'intégrité
sqlite3 dev.db "PRAGMA integrity_check;"

# Appliquer les migrations si le schéma a changé
npx prisma migrate deploy

# Vérifier les données
sqlite3 dev.db "SELECT COUNT(*) FROM Idea;"
sqlite3 dev.db "SELECT COUNT(*) FROM SaviezVousFact;"
```

**Permissions :**
```bash
# Le fichier dev.db doit être lisible et modifiable par le processus Node.js
sudo chmod 664 dev.db
sudo chown www-data:www-data dev.db
```

### Étape 4 : Configuration (.env)

Créer `/srv/http/stashfru/.env` :

```env
# Base de données SQLite (chemin absolu recommandé en production)
DATABASE_URL="file:/srv/http/stashfru/dev.db"

# Authentification — générer avec: openssl rand -base64 32
NEXTAUTH_SECRET="votre-clé-secrète-aléatoire"

# URL de production (HTTPS)
NEXTAUTH_URL="https://stashfru.example.com"

# LLM (optionnel, pour génération d'idées)
LLM_BASE_URL="https://votre-api-llm:port/v1"
LLM_MODEL="qwen3.6"
LLM_API_KEY="votre-cle-api"

# TLS (si le LLM utilise un certificat auto-signé)
# NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Points de sécurité :**
- `NEXTAUTH_SECRET` doit être une chaîne aléatoire de 32+ caractères
- `NEXTAUTH_URL` doit correspondre au domaine réel (HTTPS en production)
- `dev.db` est dans `.gitignore` — le fichier de production ne sera pas versionné
- Les clés API (`LLM_API_KEY`, `NEXTAUTH_SECRET`) ne sont pas exposées via le navigateur

### Étape 5 : Build et démarrage

```bash
# Build de production
npm run build

# Démarrer avec PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Démarrer l'application
pm2 start npm --name "stashfru" -- start

# Configurer le démarrage automatique
pm2 save
pm2 startup

# Vérifier que l'application tourne
pm2 status
pm2 logs stashfru
```

**L'application écoute sur `http://localhost:3000`.**

### Étape 6 : Configuration Apache

Créer le fichier de virtual host :

```bash
sudo nano /etc/apache2/sites-available/stashfru.conf
```

Contenu :

```apache
<VirtualHost *:80>
    ServerName stashfru.example.com

    # Rediriger HTTP vers HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName stashfru.example.com

    # SSL (avec Let's Encrypt recommandé)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/stashfru.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/stashfru.example.com/privkey.pem

    # Proxy vers Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # WebSocket support (Next.js App Router)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]

    # Fichiers statiques (optimisation)
    Alias /public /srv/http/stashfru/public
    <Directory /srv/http/stashfru/public>
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>

    Alias /_next/static /srv/http/stashfru/.next/static
    <Directory /srv/http/stashfru/.next/static>
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>

    Alias /favicon.ico /srv/http/stashfru/public/favicon.ico
    <Location /favicon.ico>
        Require all granted
    </Location>

    # Restriction des fichiers sensibles
    <LocationMatch "\.db$">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/\.env">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/prisma/migrations/">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/node_modules/">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/src/">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/\.git/">
        Require all denied
    </LocationMatch>
</VirtualHost>
```

**Activer le virtual host :**
```bash
sudo a2ensite stashfru.conf
sudo systemctl reload apache2
```

**Certificat SSL (Let's Encrypt) :**
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d stashfru.example.com
```

### Structure des fichiers sur le serveur

```
/srv/http/stashfru/
├── .env                    # Variables d'environnement (secret)
├── dev.db                  # Base de données SQLite (secret)
├── node_modules/           # Dépendances (après npm ci)
├── .next/                  # Build de production (après npm run build)
├── public/                 # Fichiers statiques (images, favicon)
├── prisma/                 # Schéma et migrations
├── src/                    # Code source (restreint par Apache)
├── scripts/                # Scripts utilitaires
├── package.json
└── tsconfig.json
```

### Fichiers sensibles et leur protection

| Fichier | Emplacement | Protection Apache | Pourquoi |
|---------|-------------|-------------------|----------|
| `dev.db` | Racine | `LocationMatch "\.db$" deny` | Mots de passe hashés + toutes les données |
| `.env` | Racine | `LocationMatch "^/\.env" deny` | Clés API, NEXTAUTH_SECRET, LLM_API_KEY |
| `src/` | Racine | `LocationMatch "^/src/" deny` | Code source TypeScript |
| `node_modules/` | Racine | `LocationMatch "^/node_modules/" deny` | Dépendances (gros) |
| `.git/` | Racine | `LocationMatch "^/\.git/" deny` | Historique complet du projet |
| `prisma/migrations/` | Racine | `LocationMatch "^/prisma/migrations/" deny` | Migrations SQL brutes |

### Fichiers publics (accessibles via HTTP)

| Fichier | Emplacement | Cache |
|---------|-------------|-------|
| `public/*` | `/public/` | 1 an (immutable) |
| `._next/static/*` | `/_next/static/` | 1 an (immutable) |
| `favicon.ico` | Racine | Cache navigateur |

### Maintenance

```bash
# Redémarrer l'application
pm2 restart stashfru

# Voir les logs
pm2 logs stashfru --lines 100

# Mettre à jour (git pull + rebuild)
cd /srv/http/stashfru
git pull
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart stashfru

# Backup de la base de données
cp /srv/http/stashfru/dev.db "/srv/http/stashfru/dev.db.backup.$(date +%Y%m%d)"

# Restaurer
cp "/srv/http/stashfru/dev.db.backup.20260702" /srv/http/stashfru/dev.db
```

### Vérification

1. Ouvrir `https://stashfru.example.com` dans un navigateur
2. Vérifier que l'application charge correctement
3. Tester la connexion avec `curl -I https://stashfru.example.com`
4. Vérifier les logs PM2 : `pm2 logs stashfru`
5. Vérifier les logs Apache : `sudo tail -f /var/log/apache2/error.log`

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

### Base de données corrompue

```bash
# Supprimer et recréer
rm dev.db
npx prisma db push
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts
```

### Idées sans topic

```bash
# Vérifier
sqlite3 dev.db "SELECT id FROM Idea WHERE id NOT IN (SELECT ideaId FROM IdeaTopic);"

# Recréer les associations (assigne le premier topic trouvé)
sqlite3 dev.db "INSERT INTO IdeaTopic (id, ideaId, topicId) SELECT 'fix_' || id, id, (SELECT id FROM Topic LIMIT 1) FROM Idea WHERE id NOT IN (SELECT ideaId FROM IdeaTopic);"
```

### Topic sans idées

```bash
# Vérifier
sqlite3 dev.db "SELECT t.name, COUNT(it.id) FROM Topic t LEFT JOIN IdeaTopic it ON t.id = it.topicId GROUP BY t.name HAVING COUNT(it.id) = 0;"

# Solution: lancer generate-ideas.ts ou ingest-wikipedia.ts
```

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

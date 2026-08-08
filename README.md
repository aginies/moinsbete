# MoinsBête — Apprentissage rapide en français

Application de découverte de connaissances bite-sized : idées, sujets, sources Wikipédia, bookmarks, révision par répétition espacée et plan d'apprentissage.

## Vue d'ensemble

MoinsBête propose des idées courtes et actionnables issues de Wikipédia, générées par LLM ou écrites manuellement. Chaque idée contient un titre, un contenu explicatif et un takeaway actionnable.

Les idées bookmarkées entrent dans un cycle de **révision par répétition espacée** (SRS) qui optimise la mémorisation à long terme.

## Démonstration

[Voir la démo de MoinsBête sur YouTube](https://www.youtube.com/shorts/dHPhT6kqftw)

![Demo MoinsBête](https://img.youtube.com/vi/dHPhT6kqftw/maxresdefault.jpg)

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
moinsbete/
├── prisma/
│   ├── schema.prisma          # Modèle de données (36 modèles)
│   ├── migrations/            # Migrations Prisma
│   └── seed.ts                # Création des topics racine
├── src/
│   ├── lib/                   # db, auth, llm, utils, rate-limiter, srs, bookmarks
│   ├── app/                   # Pages + API routes (incl. /admin, /lobby)
│   ├── components/            # IdeaCard, Feed, feed cards (14 sources)
│   ├── scripts/               # seed-ideas, generate-ideas, ingest-wikipedia, cache-*
│   ├── actions/               # Server actions (auth, bookmarks, favorites, cron)
│   ├── hooks/                 # use-card-visibility, use-bookmark-toggle, etc.
│   └── locales/               # i18n fr/en
├── docs/                      # Documentation détaillée
├── scripts/                   # scrape-saviez-vous, update, deploy, install
├── .env                       # Variables d'environnement
└── next.config.ts             # Config Next.js
```

## Installation rapide

```bash
git clone <repo-url>
cd moinsbete
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Voir [docs/INSTALLATION.md](./INSTALLATION.md) pour les étapes complètes.

## Configuration rapide

Variables d'environnement requises :

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="une-clé-aléatoire"
NEXTAUTH_URL="http://localhost:3000"
```

Voir [docs/CONFIGURATION.md](./CONFIGURATION.md) pour le détail.

## Fonctionnalités

### Cartes feed (14 sources)
- **Le Saviez-vous** — Faits surprenants de Wikipédia
- **Wikipedia Image** — Image du jour Wikipédia
- **CNRS News** — Articles de recherche CNRS
- **Radio France** — Épisodes radio
- **NEWS** — Actualités multi-sources
- **Wikimedia / Wiki Loves / Pixabay** — Images libres de droits
- **Portail Lexical** — Mot du jour
- **Portail Wikipédia** — Articles du portail
- **Proverbe** — Proverbes du monde
- **Formule 1** — Actualités F1
- **Citation** — Citations Wikiquote
- **Articles insolites** — Faits surprenants de Wikipédia (1 par jour)

### Système de révision
- Bookmarks avec révision espacée (SRS)
- Plan d'apprentissage avec streak tracking
- Historique de consultation

### Fonctionnalités sociales
- Lobby de partage (partager des bookmarks avec d'autres utilisateurs)
- Favoris personnels et partagés
- Export HTML des favoris

### Admin
- Dashboard avec stats par source
- Gestion des utilisateurs
- Nettoyage des items expirés
- Refresh individuel ou global du cache

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

## Déploiement

Voir [docs/DEPLOYMENT.md](./DEPLOYMENT.md) pour l'installation sur Apache avec PM2.

## Développement

Voir [docs/DEVELOPMENT.md](./DEVELOPMENT.md) pour ajouter des topics, générer du contenu, et l'architecture des pages.

## Tests

359 tests sur 31 fichiers (vitest).

```bash
npm test              # Exécuter tous les tests
npm test -- --watch   # Mode watch
```

Couverture :
- `src/lib/` — utils, slugify, url validation, rate-limiter, csrf, auth, bookmark, feed-helpers, saviez-vous, view, srs, llm, radio-bookmark, image-url-encoder, constants
- `src/actions/` — auth-actions, bookmark-actions, topic-actions, view-actions, review-actions
- `src/scripts/` — seed-ideas data validation
- `src/app/` — robots.txt, feed helpers, pagination, wikimedia-topics route
- `src/hooks/` — use-card-visibility

## Dépannage

Voir [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour les problèmes courants.

## Base de données

Voir [docs/DATABASE.md](./DATABASE.md) pour la gestion complète (backup, reset, diagnostics).

## Contenu

Voir [docs/CONTENT.md](./CONTENT.md) pour les 3 pipelines de génération de contenu.

**Contact**: Pour réinitialiser votre mot de passe ou partager un retour, envoyez un email à [moinsbete@ginies.org](mailto:moinsbete@ginies.org).

---

**Licence**: Private — Tous droits réservés.

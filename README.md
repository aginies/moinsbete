# MoinsBête — Apprentissage rapide en français

Application de découverte de connaissances bite-sized : idées, sujets, sources Wikipédia, bookmarks et plan d'apprentissage.

## Vue d'ensemble

MoinsBête propose des idées courtes et actionnables issues de Wikipédia, générées par LLM ou écrites manuellement. Chaque idée contient un titre, un contenu explicatif et un takeaway actionnable.

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
│   ├── schema.prisma          # Modèle de données
│   ├── migrations/            # Migrations Prisma
│   └── seed.ts                # Création des topics racine
├── src/
│   ├── lib/                   # db, auth, llm, utils, rate-limiter
│   ├── app/                   # Pages + API routes
│   ├── components/            # IdeaCard, Feed, Search, Topics, UI
│   └── scripts/               # seed-ideas, generate-ideas, ingest-wikipedia
├── docs/                      # Documentation détaillée
├── scripts/                   # scrape-saviez-vous, update
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

## Commandes principales

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npx prisma studio` | Interface DB |
| `npx tsx src/scripts/seed-ideas.ts` | Seed manuel |
| `npx tsx src/scripts/generate-ideas.ts` | Génération LLM |
| `npx tsx scripts/scrape-saviez-vous.ts` | Scraper Wikipédia |

## Déploiement

Voir [docs/DEPLOYMENT.md](./DEPLOYMENT.md) pour l'installation sur Apache avec PM2.

## Développement

Voir [docs/DEVELOPMENT.md](./DEVELOPMENT.md) pour ajouter des topics, générer du contenu, et l'architecture des pages.

## Tests

171 tests sur 19 fichiers (vitest).

```bash
npm test              # Exécuter tous les tests
npm test -- --watch   # Mode watch
```

Couverture :
- `src/lib/` — utils, slugify, url validation, rate-limiter, csrf, auth, bookmark, feed-helpers, saviez-vous, view
- `src/actions/` — auth-actions, bookmark-actions, topic-actions, view-actions
- `src/scripts/` — seed-ideas data validation
- `src/app/` — robots.txt, feed helpers, pagination

## Sécurité

Voir [docs/SECURITY.md](./SECURITY.md) pour l'audit de sécurité, les rôles et le rate limiting.

## Dépannage

Voir [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour les problèmes courants.

## Base de données

Voir [docs/DATABASE.md](./DATABASE.md) pour la gestion complète (backup, reset, diagnostics).

## Contenu

Voir [docs/CONTENT.md](./CONTENT.md) pour les 3 pipelines de génération de contenu.

**Contact**: Pour réinitialiser votre mot de passe ou partager un retour, envoyez un email à [moinsbete@ginies.org](mailto:moinsbete@ginies.org).

---

**Licence**: Private — Tous droits réservés.

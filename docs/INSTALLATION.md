# Installation

## Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 10
- **SQLite** (généralement préinstallé)

## Étapes complètes

```bash
# 1. Cloner le repo
git clone <repo-url>
cd moinsbete

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (voir docs/CONFIGURATION.md)
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer le client Prisma
npx prisma generate

# 5. Appliquer les migrations (crée la base SQLite)
npx prisma db push

# 6. Seed initial (topics + idées manuelles)
npm run db:seed

# 7. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

## Vérification

```bash
# Tester que l'application tourne
curl -I http://localhost:3000

# Vérifier la base de données
npx prisma studio
```

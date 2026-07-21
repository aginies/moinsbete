# Base de données

## Vue d'ensemble

- **Type**: SQLite (fichier unique `dev.db`)
- **ORM**: Prisma v6
- **Fichier**: `dev.db` à la racine du projet (dans `.gitignore`)
- **Emplacement**: à la racine du projet (`dev.db`)
- **Optimisations**: WAL mode, synchronous normal, busy timeout (see `src/lib/db.ts`)

## Statistiques actuelles

| Modèle | Description | Compteur |
|--------|-------------|----------|
| **Idea** | Idées bite-sized (titre + contenu + takeaway) | 736 |
| **Source** | Sources (Wikipédia articles) | 183 |
| **Topic** | Sujets de connaissance | 21 |
| **IdeaTopic** | Association Idea ↔ Topic (1 par idée) | 736 |
| **SaviezVousFact** | Faits "Le saviez-vous" | 8 136 |
| **Collection** | Collections d'idées | 6 |
| **User** | Utilisateurs (email, hash mot de passe, role: USER/ADMIN, enabled, lastLogin, lastVisited) | variable |
| **Bookmark** | Bookmarks utilisateur | variable |
| **ViewedIdea** | Historique de consultation | variable |
| **GrowthPlan** | Plan d'apprentissage (streak, dernière activité) | variable |
| **TopicSuggestion** | Suggestions de nouveaux topics (admin) | variable |
| **PasswordResetToken** | Tokens de réinitialisation de mot de passe | variable |
| **SharedLobbyBookmark** | Favoris partagés dans le lobby | variable |
| **CachedConfig** | Config cachée (proverbes, global card visibility, card order) | variable |
| **CachedCnrsArticle** | Articles CNRS en cache (TTL: 24h) | variable |
| **CachedRadioEpisode** | Épisodes Radio France en cache (TTL: 24h) | variable |
| **CachedWikipediaImage** | Images Wikipédia en cache (TTL: 30 jours) | variable |
| **CachedWikiLovesImage** | Images Wiki Loves en cache (TTL: 30 jours, source: MONUMENTS/EARTH) | variable |
| **UserWikimediaTopic** | Catégories Wikimedia actives par utilisateur | variable |

## Gestion de la base de données

### 1. Initialisation (nouvelle installation)

```bash
# Appliquer les migrations (crée les tables)
npx prisma db push

# Seed initial (20 topics racine)
npx tsx prisma/seed.ts

# Idées manuelles (148 idées pré-écrites)
npx tsx src/scripts/seed-ideas.ts
```

### 2. Explorer la base de données

```bash
# Interface graphique (recommandé)
npx prisma studio

# Commandes SQLite directes
sqlite3 dev.db ".tables"
sqlite3 dev.db "SELECT COUNT(*) FROM Idea;"
sqlite3 dev.db "SELECT idea.title, topic.name FROM IdeaTopic JOIN Idea ON IdeaTopic.ideaId = Idea.id JOIN Topic ON IdeaTopic.topicId = Topic.id LIMIT 10;"
```

### 3. Backup

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

### 4. Nettoyage / Reset

```bash
# Supprimer TOUTES les données (garde la structure)
sqlite3 dev.db "DELETE FROM IdeaTopic; DELETE FROM Idea; DELETE FROM Source; DELETE FROM SourceTopic; DELETE FROM SaviezVousFact; DELETE FROM Bookmark; DELETE FROM ViewedIdea; DELETE FROM Collection; DELETE FROM GrowthPlan; DELETE FROM PasswordResetToken; DELETE FROM TopicSuggestion; DELETE FROM User;"

# Recréer depuis zéro
rm dev.db
npx prisma db push
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts
```

### 5. Diagnostic

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

### 6. Workflow typique d'enrichissement

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

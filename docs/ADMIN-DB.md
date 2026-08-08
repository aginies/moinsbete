# Actions administrateur sur la base de données

Guide pratique pour gérer les données : clés API, utilisateurs, favoris, cache, configuration globale.

**Outils utilisés** : `sqlite3 dev.db` ou `npx prisma studio` (interface graphique).

---

## Clés API

### Ajouter / modifier une clé API

Modifier `.env`, puis redémarrer l'app :

```bash
# FreeNewsAPI (actualités)
echo 'FREE_NEWS_API_KEY="nouvelle-cle"' >> .env

# Pixabay (vidéos)
echo 'PIXABAY_API_KEY="nouvelle-cle"' >> .env

# LLM (génération d'idées)
echo 'LLM_API_KEY="nouvelle-cle"' >> .env

# Cron cache
echo 'CRON_SECRET="$(openssl rand -hex 32)"' >> .env

# Redémarrer
pm2 restart moinsbete
```

### Retirer une clé API

```bash
# Supprimer la ligne du .env
sed -i '/^FREE_NEWS_API_KEY/d' .env
pm2 restart moinsbete
```

**Effet** : les scripts de cache qui dépendent de la clé skip la source (log avertissement).

### Générer un nouveau CRON_SECRET

```bash
openssl rand -hex 32
```

---

## Utilisateurs

### Lister les utilisateurs

```sql
SELECT id, email, displayName, role, enabled, createdAt
FROM User
ORDER BY createdAt DESC;
```

### Modifier le rôle

```sql
--ADMIN
UPDATE User SET role = 'ADMIN' WHERE email = 'user@example.com';

--USER
UPDATE User SET role = 'USER' WHERE email = 'user@example.com';
```

### Désactiver / réactiver

```sql
UPDATE User SET enabled = false WHERE email = 'user@example.com';
UPDATE User SET enabled = true WHERE email = 'user@example.com';
```

### Supprimer un utilisateur

```sql
-- Bookmarks, ViewedIdeas, GrowthPlan, etc. supprimés en cascade (onDelete: Cascade)
DELETE FROM User WHERE email = 'user@example.com';
```

### Compter les utilisateurs

```sql
-- Total
SELECT COUNT(*) as total FROM User;

-- Par rôle
SELECT role, COUNT(*) as count FROM User GROUP BY role;

-- Actifs vs désactivés
SELECT enabled, COUNT(*) as count FROM User GROUP BY enabled;
```

---

## Réinitialiser les données utilisateur

### Favoris (tous)

```sql
-- Par email
DELETE FROM Bookmark
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

### Favoris par type

```sql
-- Types disponibles: IDEA, RADIO_FRANCE, CNRS_NEWS, IMAGE_DU_JOUR, SAVIEZ_VOUS,
-- IMAGE_WIKIMEDIA, IMAGE_WIKILOVES, IMAGE_PIXABAY, PORTAIL_LEXICAL, PROVERBE,
-- NEWS, F1, PORTAIL_WIKIPEDIA, CITATION, INSOLITE

DELETE FROM Bookmark
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com')
  AND type = 'CNRS_NEWS';
```

### Historique de consultation

```sql
DELETE FROM ViewedIdea
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

### Streak et plan d'apprentissage

```sql
DELETE FROM GrowthPlan
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

### Préférences cartes (reset aux défauts)

```sql
UPDATE User SET
  wikipediaImageCardVisible = true,
  wikipediaImageShowEn = false,
  saviezVousCardVisible = true,
  radioFranceCardVisible = true,
  imageWikimediaCardVisible = true,
  imageWikiLovesCardVisible = true,
  imageWikiLovesShowCategories = true,
  imageWikimediaShowCategories = true,
  imagePixabayCardVisible = true,
  imagePixabayShowCategories = true,
  imagePixabayActiveCategory = 'bird',
  portailLexicalCardVisible = true,
  portailWikipediaCardVisible = true,
  f1CardVisible = true,
  proverbeCardVisible = true,
  citationCardVisible = true,
  insoliteCardVisible = true,
  newsCardVisible = true,
  cardNavBarEnabled = true,
  cardOrder = null
WHERE email = 'user@example.com';
```

### Catégories Wikimedia / Wiki Loves

```sql
DELETE FROM UserWikimediaTopic
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');

DELETE FROM UserWikiLovesTopic
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

### Topics suivis

```sql
-- Remove all followed topics for a user (same query as un-follow in app)
UPDATE User SET following = NULL WHERE email = 'user@example.com';
```

### Partages lobby

```sql
DELETE FROM SharedLobbyBookmark
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

### Tokens réinitialisation mot de passe

```sql
DELETE FROM PasswordResetToken
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

### Reset complet (garde le compte, supprime tout le reste)

```sql
DELETE FROM SharedLobbyBookmark
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
DELETE FROM Bookmark
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
DELETE FROM ViewedIdea
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
DELETE FROM GrowthPlan
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
DELETE FROM PasswordResetToken
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
DELETE FROM UserWikimediaTopic
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
DELETE FROM UserWikiLovesTopic
WHERE userId IN (SELECT id FROM User WHERE email = 'user@example.com');
```

---

## Cache

### Statistiques par source

```sql
-- Total et expirés par modèle
SELECT
  'CachedCnrsArticle' as source, COUNT(*) as total,
  SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) as expired
FROM CachedCnrsArticle
UNION ALL SELECT 'CachedRadioEpisode', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedRadioEpisode
UNION ALL SELECT 'CachedWikipediaImage', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedWikipediaImage
UNION ALL SELECT 'CachedWikiLovesImage', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedWikiLovesImage
UNION ALL SELECT 'CachedNewsArticle', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedNewsArticle
UNION ALL SELECT 'CachedF1Article', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedF1Article
UNION ALL SELECT 'CachedWikipediaPortalArticle', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedWikipediaPortalArticle
UNION ALL SELECT 'CachedCitationArticle', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedCitationArticle
UNION ALL SELECT 'CachedInsoliteArticle', COUNT(*), SUM(CASE WHEN expiresAt < datetime('now') THEN 1 ELSE 0 END) FROM CachedInsoliteArticle;
```

### Nettoyage

```bash
# Via script (9 modèles + news max-age 5j)
npm run cache:cleanup

# Via API (recommandé en production)
curl -H "x-cron-token: $CRON_SECRET" http://localhost:3000/api/cron/cache
```

### Vider une source spécifique

```sql
DELETE FROM CachedCnrsArticle WHERE expiresAt < datetime('now');
DELETE FROM CachedNewsArticle;  -- Tout vider
DELETE FROM CachedNewsArticle WHERE source = 'freenewsapi.io';  -- Seulement freenewsapi
```

### Données sans TTL

```sql
-- Saviez-vous (faits statiques)
SELECT COUNT(*) FROM SaviezVousFact;

-- Portail Lexical (mots du jour)
SELECT COUNT(*) FROM PortailLexicalMotDuJour;
SELECT date, word FROM PortailLexicalMotDuJour ORDER BY date DESC LIMIT 5;

-- Proverbes (dans CachedConfig)
SELECT key, LENGTH(value) as json_size FROM CachedConfig WHERE key = 'proverbes_all';
```

---

## Configuration globale

### Visibilité des cartes

```sql
-- Lire
SELECT key, value FROM CachedConfig WHERE key = 'cartes_global_visibility';

-- Réinitialiser (toutes visibles)
UPDATE CachedConfig SET value = '{"saviezVous":true,"wikipedia":true,"cnrs":true,"radioFrance":true,"wikimedia":true,"wikiloves":true,"pixabay":true,"portailLexical":true,"portailWikipedia":true,"proverbe":true,"news":true,"f1":true,"citation":true,"insolite":true}' WHERE key = 'cartes_global_visibility';
```

### Ordre des cartes

```sql
-- Lire l'ordre global par défaut
SELECT key, value FROM CachedConfig WHERE key = 'card_default_order';
```

---

## Contenu

### Statistiques idées

```sql
-- Total
SELECT COUNT(*) as total FROM Idea;

-- Par topic
SELECT t.name, COUNT(it.id) as ideas
FROM Topic t
JOIN IdeaTopic it ON t.id = it.topicId
GROUP BY t.name
ORDER BY ideas DESC;

-- Non publiées
SELECT COUNT(*) FROM Idea WHERE isPublished = false;

-- Non améliorées (contenu court)
SELECT COUNT(*) FROM Idea WHERE isEnhanced = false;
```

### Statistiques sources

```sql
-- Total
SELECT COUNT(*) FROM Source;

-- Par type
SELECT type, COUNT(*) FROM Source GROUP BY type;
```

### Saviez-vous

```sql
-- Total
SELECT COUNT(*) FROM SaviezVousFact;

-- Avec image
SELECT COUNT(*) FROM SaviezVousFact WHERE imageFilename IS NOT NULL;

-- Sans image
SELECT COUNT(*) FROM SaviezVousFact WHERE imageFilename IS NULL;
```

### Proverbes

```sql
-- Vérifier que les proverbes sont chargés
SELECT key, json_extract(value, '$[0]') as first_proverb
FROM CachedConfig
WHERE key = 'proverbes_all';
```

### Portail Lexical

```sql
-- Mots du jour disponibles
SELECT COUNT(*) FROM PortailLexicalMotDuJour;

-- Dernier mot importé
SELECT date, word FROM PortailLexicalMotDuJour ORDER BY date DESC LIMIT 1;
```

---

## Partages lobby

```sql
-- Total
SELECT COUNT(*) FROM SharedLobbyBookmark;

-- Par type
SELECT resourceType, COUNT(*) as count
FROM SharedLobbyBookmark
GROUP BY resourceType;

-- Par utilisateur
SELECT u.email, COUNT(*) as shares
FROM SharedLobbyBookmark sl
JOIN User u ON sl.userId = u.id
GROUP BY u.email
ORDER BY shares DESC;
```

---

## Suggestions

### Topiques suggérés

```sql
-- En attente
SELECT categoryName, confidence, articleCount, status
FROM TopicSuggestion
WHERE status = 'PENDING'
ORDER BY confidence DESC;

-- Approuver
UPDATE TopicSuggestion SET status = 'APPROVED' WHERE id = 'suggestion-id';

-- Rejeter
UPDATE TopicSuggestion SET status = 'REJECTED' WHERE id = 'suggestion-id';
```

### Suggestions utilisateurs

```sql
-- En attente
SELECT u.email, s.title, s.description, s.createdAt
FROM UserSuggestion s
JOIN User u ON s.userId = u.id
ORDER BY s.createdAt DESC;
```

---

## Tokens réinitialisation

```sql
-- Tokens expirés
SELECT COUNT(*) FROM PasswordResetToken WHERE expiresAt < datetime('now');

-- Nettoyer
DELETE FROM PasswordResetToken WHERE expiresAt < datetime('now');
```

---

## Favoris orphelins

Voir `docs/TROUBLESHOOTING.md` — section "Nettoyer favoris orphelins".

---

## Références

| Doc | Contenu |
|-----|---------|
| `docs/DATABASE.md` | Structure, backup, nettoyage complet |
| `docs/CONTENT.md` | Scripts de cache, génération de contenu |
| `docs/CONFIGURATION.md` | Variables d'environnement, clés API |
| `docs/DEPLOYMENT.md` | Déploiement, cron système |
| `docs/TROUBLESHOOTING.md` | Diagnostic, erreurs courantes |

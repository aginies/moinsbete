# Dépannage

## Base de données corrompue

```bash
# Supprimer et recréer
rm dev.db
npx prisma db push
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts
```

## Idées sans topic

```bash
# Vérifier
sqlite3 dev.db "SELECT id FROM Idea WHERE id NOT IN (SELECT ideaId FROM IdeaTopic);"

# Recréer les associations (assigne le premier topic trouvé)
sqlite3 dev.db "INSERT INTO IdeaTopic (id, ideaId, topicId) SELECT 'fix_' || id, id, (SELECT id FROM Topic LIMIT 1) FROM Idea WHERE id NOT IN (SELECT ideaId FROM IdeaTopic);"
```

## Topic sans idées

```bash
# Vérifier
sqlite3 dev.db "SELECT t.name, COUNT(it.id) FROM Topic t LEFT JOIN IdeaTopic it ON t.id = it.topicId GROUP BY t.name HAVING COUNT(it.id) = 0;"

# Solution: lancer generate-ideas.ts ou ingest-wikipedia.ts
```

## LLM ne répond pas

```bash
# Tester la connexion
curl -X POST $LLM_BASE_URL/v1/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"$LLM_MODEL","messages":[{"role":"user","content":"test"}]}'
```

## Erreur Prisma "relationJoins"

```bash
# Vérifier la version de Prisma
npx prisma --version
# Doit être ≥ 6.0.0
```

## Images ne chargent pas

Vérifier `next.config.ts` :
```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'fr.wikipedia.org' },
    { protocol: 'https', hostname: 'upload.wikimedia.org' },
  ],
}
```

## Erreurs de déploiement Apache

```bash
# Vérifier les logs Apache
sudo tail -f /var/log/apache2/error.log

# Vérifier que les modules sont activés
apache2ctl -M | grep -E "proxy|rewrite"

# Vérifier les permissions
ls -la /srv/http/moinsbete/
sudo chown -R www-data:www-data /srv/http/moinsbete/
```

## Problèmes NextAuth

```bash
# Vérifier que NEXTAUTH_SECRET est défini
echo $NEXTAUTH_SECRET

# Vérifier que NEXTAUTH_URL correspond au domaine
echo $NEXTAUTH_URL

# Régénérer un secret si nécessaire
openssl rand -base64 32
```

## Problèmes LLM

```bash
# Vérifier la clé API
echo $LLM_API_KEY

# Tester avec curl
curl -X POST $LLM_BASE_URL/v1/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"$LLM_MODEL","messages":[{"role":"user","content":"Hello"}]}'

# Vérifier le certificat si HTTPS auto-signé
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Nettoyer favoris images d'un utilisateur

```bash
# Supprimer les favoris IMAGE_DU_JOUR, IMAGE_WIKIMEDIA, IMAGE_WIKILOVES
npx prisma db execute --url "file:./dev.db" --stdin << 'EOF'
DELETE FROM "Bookmark"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email" = 'user@example.com')
AND "type" IN ('IMAGE_DU_JOUR', 'IMAGE_WIKIMEDIA', 'IMAGE_WIKILOVES');
EOF
```

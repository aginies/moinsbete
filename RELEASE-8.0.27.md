# Release Notes — v8.0.27

**48 commits · 176 fichiers modifiés · +5 682 / −6 322** (vs v8.0.1)

## Nouveautés

### Carte NASA APOD (15ᵉ source de cartes)
- Carte complète : images quotidiennes à balayer, route API, script de cache, favoris, partage en lobby, panneau admin, locales
- Liens vers la page APOD par date (`apYYMMDD.html`)
- Section « en chiffres » de la page À propos : vraies statistiques (cachées 24 h)

## Performance
- Cache des pools de feed + montage paresseux des cartes via IntersectionObserver
- Consolidation des exports, déduplication du code (~680 lignes supprimées)
- `share-to-lobby` : réutilisation du cache `useIsLoggedIn`, suppression du fetch `/api/session` à chaque montage
- Page Favoris et config cache admin pilotées par les données

## Sécurité
- Renforcement sécurité niveau P0 + correctifs de justesse
- Gardes d'authentification pour les utilisateurs anonymes
- Vérification de session via API au lieu de la lecture du cookie (plus de reconnexion)
- Cookie de session `httpOnly` mis à `false` pour détection côté client

## Correctifs
- **Insolite** : doublon d'article quotidien, nettoyage de config, plafond `shownCount`, UX `allSeen`, scraping avant nettoyage, TTL → 72 h, page de partage manquante `/insolite/[id]`
- **Wikiloves** : opérations Redis sans timeout qui bloquent, dates du pool cassées après passage JSON, rafraîchissement affichant la même image sur les pages à balayer ; ajout au cron + `refreshAll`
- **Cache** : décodage des entités HTML dans tous les scrapers + script `db:cleanup-entities`
- **Favoris** : drapeaux no-op du basculement, limite de news clampée, code mort des proverbes
- **Portail-wiki** : correctif de `resourceId`
- **Déploiement** : `prisma db push` demande en mode interactif, annulé en CI
- **BDD** : script de réparation de la migration insolite échouée en prod
- **libsql** : gestion de `scrapedAt` en `bigint` depuis le SQL brut

## Nettoyage & Refactoring
- Suppression du code mort (fichiers, dossiers, dépendances, scripts ponctuels inutilisés)
- Consolidation des actions de favoris
- Retour des cartes Sujets au montage immédiat d'origine (revers de l'expérience perf P1)

## Documentation
- Nouveau `ADMIN-DB.md` — guide des actions base de données admin
- AGENTS.md synchronisé avec le code (source insolite, comptages, chemins)
- Détails techniques déplacés de README → DEVELOPMENT.md
- Licence corrigée en AGPLv3, mentions SRS supprimées

# Release Notes — v8.1.6

**29 commits · 176 fichiers modifiés · +5 682 / −6 322** (vs v8.0.27)

## Cartes & Sources

### Air Crash Investigation (renforcé)
- Lien vers la fiche ASN pour chaque accident — 233/237 appariés via scraper Wikipedia → ASN (bureau d'étude technique des accidents aériens)
- Parsing des tables d'épisodes depuis le wikitexte — liste complète des 237 accidents incluant les spéciaux, suppression des lignes périmées
- Page dédiée `/air-crash` + page de partage `/air-crash/[id]` — bouton de partage avec URL interne, métadonnées OG/Twitter, lien Fiche ASN
- TTL de 30 jours pour éviter les cartes vides + notifications d'erreur dans le cron
- Suppression du rafraîchissement automatique Air Crash + ASN du cron et de `refreshAll` (manuel uniquement via admin CacheTab)
- Correction du code 403 ASN : User-Agent navigateur, délais et tentatives augmentés
- Logs de débogage ajoutés pour les fetchs Wikipedia et ASN

### F1
- Tri des actualités par date de publication (plus récent en premier)
- Correction du parsing des dates pour les formats FIA et français

### APOD (NASA)
- Traduction française via MyMemory au moment du cache — `titleFr`/`explanationFr` en base, bascule EN/FR sur la carte, affichage FR dans favoris et lobby par locale, fallback au plus récent pour un chemin de date indisponible
- Décodage des entités HTML dans la sortie MyMemory — les apostrophes `&#39;` étaient laissées encodées dans les titres FR ; backfill re-traduit les lignes contenant des entités

### Insolite
- Page dédiée `/insolite` — le titre de la carte pointe vers la page, vue article quotidien plein écran

## Recherche & Navigation
- En-têtes de recherche en i18n + état d'abort/erreur + filtre normalisé sans accents
- Navigation en i18n
- Persistance du thème
- La page F1 utilise désormais le composant F1Card

## Correctifs UI
- **Favoris mobile** : barre d'onglets en ligne scrollable unique — les 9 lignes empilées poussaient le contenu sous la nav fixe ; auto-scroll de l'onglet actif, espacement desktop `pb-28`
- **Favoris mobile** : onguts inaccessibles à gauche — `justify-center` de base coupait le overflow dans le conteneur scroll ; ancrage avec `justify-start`, reset au bord gauche lors de la recherche
- **Mon-compte** : ajout de `airCrash` manquant à la liste de réordre des cartes — clé dans `CARD_DEFAULT_ORDER` mais pas dans `CARD_DEFINITIONS`, silencieusement ignorée
- **Style des cartes** : mise en forme par défaut avec forme légère, bordure fine, ombre md ; restauration de la page test-layouts + bouton admin

## Type & Infrastructure
- Correction du type `runStep` : accepte `Promise<unknown>`
- `.gitignore` : prise en compte des fichiers dotfiles utilisateur

## Documentation
- Synchronisation de `AGENTS.md` avec les changements 8.0.20–8.0.37 — APOD (traduction FR) + Air Crash (liens ASN), cron 16 étapes, 11 modèles de cache, pages dédiées, script `db:cleanup-entities`
- Page À propos : suppression de la formulation "sans friction" ; retrait d'ASN de la liste des sources de contenu (cible de lien sur les cartes air-crash, pas une source scrapeée)
- Page À propos : ajout des sources récentes — NASA APOD + Air Crash Investigation (liens ASN) dans les sections contenus, chiffres, sources et communauté

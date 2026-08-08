# Changelog 8.0.0

## Nouvelles fonctionnalites

### Carte Insolite
Nouvelle source de cartes presentant les [Articles insolites de Wikipédia](https://fr.wikipedia.org/wiki/Wikipédia:Articles_insolites) — ces articles courts, surprenants ou amusants.

- Article du jour avec suivi persistant (vu/non vu)
- Extraction des images d'infobox depuis les pages
- Enrichissement par lots avec images (`--enrich`)
- Favoris et partage lobby avec images
- Positionnee en haut de l'ordre par defaut des cartes

### Carte Citations
Nouvelle source de cartes avec des citations celebres issues de [Wikiquote](https://fr.wikiquote.org).

- Citation du jour
- Collections thematiques par theme et par auteur
- Page dediee `/citations` avec recherche
- Favoris et partage lobby

### Portail Lexical — Mot du Jour
Nouvelle carte presentant un nouveau mot francais chaque jour via Portail Lexical.

- Definitions completes (TLFi et Wiktionnaire)
- Etymologie avec dates d'attestation
- Exemples d'usage dans la litterature
- Page dediee `/portail-lexical` avec recherche
- Cache par date (pas de TTL)

### Ameliorations de la recherche
La recherche globale couvre maintenant **10 categories** :

- Sujets, Idees, Faits, Proverbes, Images, Sources (existants)
- **News**, **Citations**, **Portail Wikipedia**, **Insolite** (nouveaux)
- Resultats limites a 5 par categorie

### Mises a jour des cartes
- Nouvelle barre de navigation avec raccourcis (IntersectionObserver)
- Preload au swipe sur les cartes images (Wikimedia, Wiki Loves, Pixabay)
- Variants de mise en page etendue avec page de test
- Systemes de thematisation centralise

### Export des favoris
- Export de tous les favoris en HTML

### Filtre Wikipedia EN
- Option de filtre images Wikipedia en anglais pour l'Image du jour

### Capacitor
- Configuration initiale pour application native Android/iOS

## Corrections et ameliorations

- **Lobby** : icone poubelle toujours visible ; partage images Wikimedia corrige ; citations incluses dans les filtres
- **Portail Wikipedia** : requetes paginees au lieu de charger 5400+ articles
- **Portail Lexical** : mot du jour en double supprime dans l'historique ; upsert au lieu de create
- **Revision** : pagination, verification proprietaire, gestion clavier, AbortController
- **Citations** : TTL passe a 24h ; recyclage corrige a chaque cron ; filtrage sources nulles
- **Sujets** : utilisateurs anonymes utilisent `CARD_DEFAULT_ORDER` ; priorite a l'ordre DB
- **Ordre des cartes** : toutes les cartes incluses dans les parametres ; F1 ajoutee par defaut
- **Navbar** : mise en page responsive ; barre ne montre que les cartes visibles
- **Auth** : champ confirmation mot de passe + bascule affichage/masquage
- **Deploy** : optimisation PM2 Next.js ; auth cron par token ; code mort supprime
- **Tests** : mock React (useRef), imports Prisma statiques

## Documentation

- README mis a jour (14 cartes, 9 modeles cache)
- AGENTS.md mis a jour avec les conventions completes
- Variants de mise en page deplaces dans DEVELOPMENT.md
- i18n : cles locales pour les titres CNRS et Radio France

## Supprime

- `change-git-email.sh` — plus necessaire

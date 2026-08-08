# Changelog 8.0.1

## Améliorations de l'interface

### Carte Aléatoire — sélection de sujets pliable

La page `/sujets` affiche maintenant les grilles de thèmes dans une section repliable intégrée à la carte "Carte Aléatoire".

- Les sujets sont masqués par défaut, un bouton chevron permet de les afficher
- La carte "Carte Aléatoire" est positionnée au-dessus des cartes masquées
- Plus de section séparée en bas de page — tout est consolidé dans une seule carte rose

### Cartes de thème — icônes et style mis à jour

- Icône de suivi : `Plus` (non suivi) / `Check` (suivi) remplace l'icône favoris
- Cartes non suivies : bordure en pointillés (`border-dashed`) pour différencier visuellement les thèmes sélectionnés et non sélectionnés

## Corrections de style UI

### Boutons supprimer — style unifié

Tous les boutons supprimer utilisent maintenant le même style rouge cohérent :

- Portail Wikipedia : bouton supprimer rouge (etait indigo)
- Dialog de confirmation : usage du composant `Button` avec `variant="destructive"`
- Admin utilisateur : bouton supprimer avec `variant="destructive"`
- Historique : icône poubelle avec opacité et dark mode corrigés
- Favoris partagés : icônes poubelle rouges uniformes
- Revision : hover rouge (`text-destructive`)
- Feed : icônes de suppression rouges avec dark mode
- Page d'erreur : message en `text-destructive`

### Corrections mineures

- Formulaire de suggestion : message d'erreur dans un conteneur stylisé
- Détail de suggestion : usage du composant `Input`
- Pixabay : couleur bouton orange → ambre (cohérent avec le thème carte)
- WikiLoves : couleur bouton violet → indigo (cohérent avec le thème carte)
- Image du jour : hover lien bleu → teal (cohérent avec le thème carte)
- Pagination : texte en français → i18n (fr + en)

## Divers

- Nettoyage du code CNRS bookmarks (indentation)
- Import déplacé en haut dans Insolite bookmarks

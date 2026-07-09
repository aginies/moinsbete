# Pistes d'Amélioration pour MoinsBête

Ce document liste des pistes d'amélioration concrètes pour l'application **MoinsBête**, classées par thématiques (Expérience Utilisateur, Apprentissage Actif, Performance & Architecture).

---

## 1. Correction d'Erreurs & Expérience Utilisateur (UX)

### ✍️ Correction grammaticale et d'URL : `/ma-histoire` → `/mon-historique`
*   **Problème :** En français, "histoire" commence par un *h muet*. On utilise l'adjectif possessif masculin "mon" pour éviter l'hiatus ("mon histoire" et non "ma histoire"). De plus, l'en-tête de la page affiche *"Mon historique"* et la navigation l'appelle *"Historique"*.
*   **Solution :** 
    1.  Renommer le dossier de page `src/app/(main)/ma-histoire` en `src/app/(main)/mon-historique` (ou `/mon-histoire`).
    2.  Mettre à jour les références d'URL dans les composants de navigation (`bottom-nav.tsx`, `navbar.tsx`), le sitemap (`sitemap.ts`) et la documentation (`DEVELOPMENT.md`).

### 💾 Synchronisation des Favoris Radio France en Base de Données
*   **Problème :** Les favoris des documentaires Radio France (`rf_favorites`) sont actuellement stockés uniquement dans le `localStorage` du navigateur. Si l'utilisateur change d'appareil ou se déconnecte, il perd ses favoris.
*   **Solution :** Pour les utilisateurs authentifiés, enregistrer et synchroniser ces favoris en base de données en étendant le modèle `Bookmark` ou en créant une table dédiée.

---

## 2. Fonctionnalités d'Apprentissage Actif & Gamification

### 🧠 Quiz d'Auto-Évaluation par IA (Active Recall)
*   **Amélioration :** Intégrer un système de mini-quizz de 3 questions (QCM) générés dynamiquement par LLM (via `src/lib/llm.ts`) sur `/sujets`. Ces questions seraient basées sur les dernières idées consultées par l'utilisateur (`ViewedIdea`) ou ses favoris (`Bookmark`) pour renforcer l'ancrage mémoriel.

---

## 3. Optimisations Techniques & Performance

### ⚡ Remplacement du Cache en Mémoire de la Recherche
*   **Problème :** Le cache de recherche dans `src/app/api/search/route.ts` utilise un `Map` JavaScript global (`searchCache`). Dans un environnement serverless (ex: Vercel, PM2 multi-processus), la mémoire est volatile et ce cache est réinitialisé à chaque extinction de l'instance ou partagé de manière incohérente entre plusieurs processus.
*   **Solution :** Remplacer le cache en mémoire par un mécanisme de cache persistant (ex: Redis avec Upstash ou en base de données SQLite via une table de cache temporaire) pour garantir d'excellentes performances de recherche.

### 📶 PWA & Mode Hors-Ligne (Offline)
*   **Amélioration :** Configurer un Service Worker via `next-pwa` pour mettre en cache les idées déjà consultées ou enregistrées dans les favoris. Cela permettrait aux utilisateurs de continuer à lire leurs fiches MoinsBête dans le métro ou les zones sans réseau (très adapté au format d'apprentissage rapide).

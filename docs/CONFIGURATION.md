# Configuration

## Variables d'environnement (.env)

Créer un fichier `.env` à la racine avec ces variables :

```env
# Base de données SQLite
DATABASE_URL="file:./dev.db"

# Authentification
NEXTAUTH_SECRET="une-clé-secrète-aléatoire-générer-avec-openssl"
NEXTAUTH_URL="http://localhost:3000"

# LLM (pour génération d'idées et ingestion Wikipédia)
LLM_BASE_URL="https://votre-api-llm:port/v1"
LLM_MODEL="nom-du-modele"
LLM_API_KEY="votre-cle-api"
```

## Génération de NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Fallback dans le code : `k9sF2mNpQ7xR4wL8vB3jH6tY0cA5dE1gI9oU2iP7aS4fG` (à remplacer en production).

## Configuration LLM

Le LLM doit être compatible avec l'API OpenAI (endpoint `/v1/chat/completions`).

Exemple de configuration :
```env
LLM_BASE_URL="https://100.72.33.21:49222/v1"
LLM_MODEL="qwen3.6"
LLM_API_KEY="secret"
```

**Note:** Si le LLM utilise un certificat auto-signé, définir :
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Variables optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environment (development/production) | development |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Désactiver TLS verification | 1 |

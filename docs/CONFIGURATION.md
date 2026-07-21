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
LLM_BASE_URL="https://votre-api-llm:port/v1"
LLM_MODEL="qwen3.6"
LLM_API_KEY="votre-cle-api"
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
| `TRUST_PROXY` | Activer les headers `x-forwarded-for` et `cf-connecting-ip` pour IP client | `false` |
| `RATE_LIMITER_DRIVER` | Driver de rate limiting: `redis` ou `memory` | `memory` |
| `REDIS_URL` | URL Redis pour rate limiting | `redis://localhost:6379` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | — |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | — |
| `RESEND_API_KEY` | Clé API resend pour envoi d'emails | — |
| `EMAIL_FROM` | Adresse expéditeur des emails | `Moins Bete <noreply@moinsbete.com>` |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (captcha inscription) | — |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | — |
| `PIXABAY_API_KEY` | Clé API Pixabay pour vidéos | — |
| `REGISTRATION_LOCKED` | Verrouiller l'inscription | `false` |

## Configuration email (réinitialisation de mot de passe)

Pour activer l'envoi d'emails de réinitialisation de mot de passe :

1. Créer un compte sur [resend.com](https://resend.com)
2. Copier la clé API depuis le dashboard
3. Ajouter dans `.env` :
   ```env
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM="Moins Bete <noreply@votre-domaine.com>"
   ```
4. Vérifier le domaine dans le dashboard resend (obligatoire pour l'envoi)

Le lien de réinitialisation pointe vers `${NEXTAUTH_URL}/reset-password/[token]`.

## Rate limiting

Le rate limiter supporte 3 backends:

### In-memory (par défaut)

Chaque instance possède sa propre mémoire. Suffisant pour déploiement single-node.

```env
RATE_LIMITER_DRIVER=memory  # défaut
```

### Redis

Pour déploiement multi-instance ou load balancing.

```env
RATE_LIMITER_DRIVER=redis
REDIS_URL=redis://localhost:6379
```

### Upstash (serverless)

```env
RATE_LIMITER_DRIVER=redis
UPSTASH_REDIS_REST_URL=https://<region>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>
```

Endpoints rate limités:

| Endpoint | Limite | Key |
|----------|--------|-----|
| `/login` | 5/min | IP client |
| `/register` | 3/min | IP client |
| `/api/search` | 30/min | IP client |
| `/api/topics/suggest` | 10/min | IP client |
| `/api/saviez-vous` | 20/min | IP client |
| `/api/radio-france` | 30/min | IP client |
| `/api/wikipedia-image` | 10/min | IP client |
| `/api/image-wikimedia` | 30/min | IP client |
| `/api/image-wikiloves` | 30/min | IP client |
| `/api/history` | 60/min | User ID |
| `/api/auth/reset-password/generate` | 3/min | IP client |
| `/api/auth/reset-password` | 5/min | IP client |
| `/api/lobby` | 30/min | IP client |
| `/api/lobby/[id]` | 10/min | IP client |

### Résolution d'IP client

L'IP client est résolue dans cet ordre:

1. `request.ip` (Next.js natif, Vercel/Netlify)
2. `cf-connecting-ip` (Cloudflare, si `TRUST_PROXY=true` en prod)
3. `x-forwarded-for` ou `x-real-ip` (dev / prod avec proxy de confiance)

En production sans proxy de confiance, seuls `cf-connecting-ip` et `x-real-ip` sont utilisés.

# Déploiement sur un serveur Apache

## Prérequis serveur

- **Ubuntu/Debian** avec Apache, Node.js ≥ 20, npm ≥ 10
- **SQLite** (généralement préinstallé)
- Port 3000 libre pour le serveur Next.js

## Étape 1 : Préparer le serveur

```bash
# Installer Node.js 20+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs apache2 sqlite3

# Activer les modules Apache nécessaires
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
sudo systemctl restart apache2
```

## Étape 2 : Cloner et préparer l'application

```bash
# Créer le répertoire d'installation
sudo mkdir -p /srv/http/stashfru
cd /srv/http/stashfru

# Cloner le repo
git clone https://github.com/aginies/deepstash/stashfru .

# Installer les dépendances (production uniquement)
npm ci --production

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

## Étape 3 : Base de données

### Nouvelle installation :

```bash
# Seed initial (20 topics + 146 idées manuelles)
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts

# Scraper les faits "Le saviez-vous" (optionnel mais recommandé)
npx tsx scripts/scrape-saviez-vous.ts
```

### Avec une base de données existante :

```bash
# Placer le fichier dev.db dans le répertoire d'installation
sudo cp /chemin/vers/dev.db /srv/http/stashfru/dev.db

# Vérifier l'intégrité
sqlite3 dev.db "PRAGMA integrity_check;"

# Appliquer les migrations si le schéma a changé
npx prisma migrate deploy

# Vérifier les données
sqlite3 dev.db "SELECT COUNT(*) FROM Idea;"
sqlite3 dev.db "SELECT COUNT(*) FROM SaviezVousFact;"
```

**Permissions :**
```bash
# 600 pour sécurité (contient emails + bcrypt hashes)
sudo chmod 600 dev.db
sudo chown www-data:www-data dev.db
```

## Étape 4 : Configuration (.env)

Créer `/srv/http/stashfru/.env` :

```env
# Base de données SQLite (chemin absolu recommandé en production)
DATABASE_URL="file:/srv/http/stashfru/dev.db"

# Authentification — générer avec: openssl rand -base64 32
NEXTAUTH_SECRET="votre-clé-secrète-aléatoire"

# URL de production (HTTPS)
NEXTAUTH_URL="https://stashfru.example.com"

# LLM (optionnel, pour génération d'idées)
LLM_BASE_URL="https://votre-api-llm:port/v1"
LLM_MODEL="qwen3.6"
LLM_API_KEY="votre-cle-api"

# TLS (si le LLM utilise un certificat auto-signé)
# NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Points de sécurité :**
- `NEXTAUTH_SECRET` doit être une chaîne aléatoire de 32+ caractères
- `NEXTAUTH_URL` doit correspondre au domaine réel (HTTPS en production)
- `dev.db` est dans `.gitignore` — le fichier de production ne sera pas versionné
- Les clés API (`LLM_API_KEY`, `NEXTAUTH_SECRET`) ne sont pas exposées via le navigateur

## Étape 5 : Build et démarrage

```bash
# Build de production
npm run build

# Démarrer avec PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Démarrer l'application
pm2 start npm --name "stashfru" -- start

# Configurer le démarrage automatique
pm2 save
pm2 startup

# Vérifier que l'application tourne
pm2 status
pm2 logs stashfru
```

L'application écoute sur `http://localhost:3000`.

## Étape 6 : Configuration Apache

Créer le fichier de virtual host :

```bash
sudo nano /etc/apache2/sites-available/stashfru.conf
```

Contenu :

```apache
<VirtualHost *:80>
    ServerName stashfru.example.com

    # Rediriger HTTP vers HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName stashfru.example.com

    # SSL (avec Let's Encrypt recommandé)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/stashfru.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/stashfru.example.com/privkey.pem

    # Proxy vers Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # WebSocket support (Next.js App Router)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]

    # Fichiers statiques (optimisation)
    Alias /public /srv/http/stashfru/public
    <Directory /srv/http/stashfru/public>
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>

    Alias /_next/static /srv/http/stashfru/.next/static
    <Directory /srv/http/stashfru/.next/static>
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>

    Alias /favicon.ico /srv/http/stashfru/public/favicon.ico
    <Location /favicon.ico>
        Require all granted
    </Location>

    # Restriction des fichiers sensibles
    <LocationMatch "\.db$">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/\.env">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/prisma/migrations/">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/node_modules/">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/src/">
        Require all denied
    </LocationMatch>

    <LocationMatch "^/\.git/">
        Require all denied
    </LocationMatch>
</VirtualHost>
```

**Activer le virtual host :**
```bash
sudo a2ensite stashfru.conf
sudo systemctl reload apache2
```

**Certificat SSL (Let's Encrypt) :**
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d stashfru.example.com
```

## Structure des fichiers sur le serveur

```
/srv/http/stashfru/
├── .env                    # Variables d'environnement (secret)
├── dev.db                  # Base de données SQLite (secret)
├── node_modules/           # Dépendances (après npm ci)
├── .next/                  # Build de production (après npm run build)
├── public/                 # Fichiers statiques (images, favicon)
├── prisma/                 # Schéma et migrations
├── src/                    # Code source (restreint par Apache)
├── scripts/                # Scripts utilitaires
├── package.json
└── tsconfig.json
```

## Fichiers sensibles et leur protection

| Fichier | Emplacement | Protection Apache | Pourquoi |
|---------|-------------|-------------------|----------|
| `dev.db` | Racine | `LocationMatch "\.db$" deny` | Mots de passe hashés + toutes les données |
| `.env` | Racine | `LocationMatch "^/\.env" deny` | Clés API, NEXTAUTH_SECRET, LLM_API_KEY |
| `src/` | Racine | `LocationMatch "^/src/" deny` | Code source TypeScript |
| `node_modules/` | Racine | `LocationMatch "^/node_modules/" deny` | Dépendances (gros) |
| `.git/` | Racine | `LocationMatch "^/\.git/" deny` | Historique complet du projet |
| `prisma/migrations/` | Racine | `LocationMatch "^/prisma/migrations/" deny` | Migrations SQL brutes |

## Fichiers publics (accessibles via HTTP)

| Fichier | Emplacement | Cache |
|---------|-------------|-------|
| `public/*` | `/public/` | 1 an (immutable) |
| `._next/static/*` | `/_next/static/` | 1 an (immutable) |
| `favicon.ico` | Racine | Cache navigateur |

## Maintenance

```bash
# Redémarrer l'application
pm2 restart stashfru

# Voir les logs
pm2 logs stashfru --lines 100

# Mettre à jour (git pull + rebuild)
cd /srv/http/stashfru
git pull
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart stashfru

# Backup de la base de données
cp /srv/http/stashfru/dev.db "/srv/http/stashfru/dev.db.backup.$(date +%Y%m%d)"

# Restaurer
cp "/srv/http/stashfru/dev.db.backup.20260702" /srv/http/stashfru/dev.db
```

## Vérification

1. Ouvrir `https://stashfru.example.com` dans un navigateur
2. Vérifier que l'application charge correctement
3. Tester la connexion avec `curl -I https://stashfru.example.com`
4. Vérifier les logs PM2 : `pm2 logs stashfru`
5. Vérifier les logs Apache : `sudo tail -f /var/log/apache2/error.log`

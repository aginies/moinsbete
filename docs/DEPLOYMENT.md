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
sudo mkdir -p /srv/http/moinsbete
cd /srv/http/moinsbete

# Cloner le repo
git clone https://github.com/aginies/moinsbete/moinsbete .

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
# Seed initial (20 topics + idées manuelles)
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts

# Scraper les faits "Le saviez-vous" (optionnel mais recommandé)
npx tsx scripts/scrape-saviez-vous.ts
```

### Avec une base de données existante :

```bash
# Placer le fichier dev.db dans le répertoire d'installation
sudo cp /chemin/vers/dev.db /srv/http/moinsbete/dev.db

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

Créer `/srv/http/moinsbete/.env` :

```env
# Base de données SQLite (chemin absolu recommandé en production)
DATABASE_URL="file:/srv/http/moinsbete/dev.db"

# Authentification — générer avec: openssl rand -base64 32
NEXTAUTH_SECRET="votre-clé-secrète-aléatoire"

# URL de production (HTTPS)
NEXTAUTH_URL="https://moinsbete.example.com"

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
pm2 start npm --name "moinsbete" -- start

# Configurer le démarrage automatique
pm2 save
pm2 startup

# Vérifier que l'application tourne
pm2 status
pm2 logs moinsbete
```

L'application écoute sur `http://localhost:3000`.

## Étape 6 : Configuration Apache

Créer le fichier de virtual host :

```bash
sudo nano /etc/apache2/sites-available/moinsbete.conf
```

Contenu :

```apache
<VirtualHost *:80>
    ServerName moinsbete.example.com

    # Rediriger HTTP vers HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName moinsbete.example.com

    # SSL (avec Let's Encrypt recommandé)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/moinsbete.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/moinsbete.example.com/privkey.pem

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
    Alias /public /srv/http/moinsbete/public
    <Directory /srv/http/moinsbete/public>
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>

    Alias /_next/static /srv/http/moinsbete/.next/static
    <Directory /srv/http/moinsbete/.next/static>
        Require all granted
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>

    Alias /favicon.ico /srv/http/moinsbete/public/favicon.ico
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
sudo a2ensite moinsbete.conf
sudo systemctl reload apache2
```

**Certificat SSL (Let's Encrypt) :**
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d moinsbete.example.com
```

## PWA (Progressive Web App)

L'application supporte l'installation sur mobile comme une app native.

**Fichiers PWA dans `public/` :**

| Fichier | Description |
|---------|-------------|
| `manifest.json` | Manifeste web app (nom, icônes, thème) |
| `icon-192.svg` | Icône 192x192 pour écran d'accueil |
| `icon-512.svg` | Icône 512x512 pour écrans haute résolution |

**Fonctionnalités PWA :**
- Installation sur écran d'accueil iOS/Android
- Lancement plein écran sans barre d'adresse
- Thème dynamique (light/dark)
- Service worker pour cache offline des favoris
- Support Web Share API

**Vérification PWA :**
```bash
# Tester avec Lighthouse
npx lighthouse https://moinsbete.example.com --view --categories=pwa

# Vérifier le manifeste
curl -I https://moinsbete.example.com/manifest.json

# Vérifier les icons
curl -I https://moinsbete.example.com/icon-192.svg
curl -I https://moinsbete.example.com/icon-512.svg
```

## Structure des fichiers sur le serveur

```
/srv/http/moinsbete/
├── .env                    # Variables d'environnement (secret)
├── dev.db                  # Base de données SQLite (secret)
├── node_modules/           # Dépendances (après npm ci)
├── .next/                  # Build de production (après npm run build)
├── public/                 # Fichiers statiques (images, PWA)
│   ├── manifest.json       # Manifeste web app
│   ├── icon-192.svg        # Icône PWA 192x192
│   ├── icon-512.svg        # Icône PWA 512x512
│   └── ...                 # Autres assets
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
pm2 restart moinsbete

# Voir les logs
pm2 logs moinsbete --lines 100

# Mettre à jour (git pull + rebuild)
cd /srv/http/moinsbete
git pull
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart moinsbete

# Backup de la base de données
cp /srv/http/moinsbete/dev.db "/srv/http/moinsbete/dev.db.backup.$(date +%Y%m%d)"

# Restaurer
cp "/srv/http/moinsbete/dev.db.backup.20260707" /srv/http/moinsbete/dev.db
```

## Vérification

1. Ouvrir `https://moinsbete.example.com` dans un navigateur
2. Vérifier que l'application charge correctement
3. Tester la connexion avec `curl -I https://moinsbete.example.com`
4. Vérifier les logs PM2 : `pm2 logs moinsbete`
5. Vérifier les logs Apache : `sudo tail -f /var/log/apache2/error.log`
6. Tester PWA sur mobile : ajouter à l'écran d'accueil

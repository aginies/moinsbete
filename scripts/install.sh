#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# MoinsBête — Install Script for Apache + PM2
# ============================================================
# Usage: sudo bash install.sh [--domain moinsbete.example.com]
# ============================================================

DOMAIN="${1:-moinsbete.local}"
INSTALL_DIR="/srv/http/moinsbete"
REPO_URL="https://github.com/aginies/deepstash.git"
BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+] $*${NC}"; }
warn() { echo -e "${YELLOW}[!] $*${NC}"; }
err()  { echo -e "${RED}[x] $*${NC}"; exit 1; }

# --- Dependency checks ---
for cmd in git npm sqlite3; do
  command -v "$cmd" >/dev/null 2>&1 || err "$cmd is required. Install it first."
done

# --- Root check ---
if [[ $EUID -ne 0 ]]; then
  err "Run with sudo: sudo bash install.sh $DOMAIN"
fi

# --- 1. Install system packages ---
log "Installing system packages..."
apt-get update -qq
apt-get install -y -qq nodejs npm apache2 sqlite3 certbot python3-certbot-apache \
  curl wget unzip gzip > /dev/null

# --- 2. Enable Apache modules ---
log "Enabling Apache modules..."
a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers > /dev/null 2>&1 || true
systemctl restart apache2

# --- 3. Clone repository ---
log "Cloning repository to $INSTALL_DIR..."
if [[ -d "$INSTALL_DIR" ]]; then
  warn "$INSTALL_DIR exists. Removing..."
  rm -rf "$INSTALL_DIR"
fi

git clone --depth 1 -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"

# --- 4. Node setup ---
log "Installing Node.js dependencies..."
cd "$INSTALL_DIR"
npm ci --production

# --- 5. Prisma setup ---
log "Generating Prisma client..."
npx prisma generate

log "Applying database migrations..."
npx prisma migrate deploy

# --- 6. Seed database ---
log "Running initial seed..."
npx tsx prisma/seed.ts
npx tsx src/scripts/seed-ideas.ts

log "Scraping Wikipedia 'Le saviez-vous ?' facts..."
npx tsx scripts/scrape-saviez-vous.ts

# --- 7. Generate secrets ---
log "Generating secrets..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
LLM_API_KEY="${LLM_API_KEY:-}"

# --- 8. Create .env ---
log "Creating .env file..."
cat > "$INSTALL_DIR/.env" <<EOF
DATABASE_URL="file:/srv/http/moinsbete/dev.db"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="https://$DOMAIN"
LLM_BASE_URL="${LLM_BASE_URL:-}"
LLM_MODEL="${LLM_MODEL:-}"
LLM_API_KEY="$LLM_API_KEY"
EOF

chmod 600 "$INSTALL_DIR/.env"

# --- 9. Build ---
log "Building Next.js application..."
npm run build

# --- 10. File permissions ---
log "Setting file permissions..."
chown -R www-data:www-data "$INSTALL_DIR"
chmod 755 "$INSTALL_DIR"
chmod 644 "$INSTALL_DIR/dev.db"
chmod 644 "$INSTALL_DIR/.next/static/css/*.css" 2>/dev/null || true
chmod -R 755 "$INSTALL_DIR/node_modules" 2>/dev/null || true

# --- 11. PM2 setup ---
log "Installing PM2..."
npm install -g pm2

log "Starting application with PM2..."
pm2 start npm --name "moinsbete" -- start --cwd "$INSTALL_DIR"
pm2 save
pm2 startup > /tmp/pm2-startup.log 2>&1 || true
log "PM2 startup command:"
tail -1 /tmp/pm2-startup.log

# --- 12. Apache virtual host ---
log "Creating Apache virtual host for $DOMAIN..."

cat > "/etc/apache2/sites-available/${DOMAIN}.conf" <<APACHEEOF
<VirtualHost *:80>
    ServerName $DOMAIN
    Redirect permanent / https://$DOMAIN/
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/$DOMAIN/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    RewriteEngine On
    RewriteCond \${HTTP:Upgrade} websocket [NC]
    RewriteCond \${HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/\$1" [P,L]

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
APACHEEOF

a2ensite "${DOMAIN}.conf" > /dev/null 2>&1
a2dissite 000-default.conf > /dev/null 2>&1 || true
systemctl reload apache2

# --- 13. SSL certificate ---
log "Obtaining SSL certificate from Let's Encrypt..."
certbot --apache -n --agree-tos --redirect --email "admin@$DOMAIN" -d "$DOMAIN" || {
  warn "Certbot failed (maybe already exists or DNS not ready). Continuing..."
  # Fallback: use existing cert or self-signed
  if [[ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]]; then
    warn "No SSL cert found. Generating self-signed cert..."
    mkdir -p /etc/ssl/moinsbete
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/moinsbete/key.pem \
      -out /etc/ssl/moinsbete/cert.pem \
      -subj "/CN=$DOMAIN" 2>/dev/null

    # Update the vhost to use self-signed cert
    sed -i "s|SSLCertificateFile /etc/letsencrypt/live/$DOMAIN/fullchain.pem|SSLCertificateFile /etc/ssl/moinsbete/cert.pem|" "/etc/apache2/sites-available/${DOMAIN}.conf"
    sed -i "s|SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem|SSLCertificateKeyFile /etc/ssl/moinsbete/key.pem|" "/etc/apache2/sites-available/${DOMAIN}.conf"
    systemctl reload apache2
  fi
}

# --- 14. Verify ---
log "Verifying installation..."
sleep 3

if pm2 list | grep -q "moinsbete.*online"; then
  log "PM2 process is running."
else
  err "PM2 process is NOT running. Check: pm2 logs moinsbete"
fi

# --- Summary ---
echo ""
echo "=============================================="
echo "  MoinsBête installed successfully!"
echo "=============================================="
echo ""
echo "  URL:         https://$DOMAIN"
echo "  Install dir: $INSTALL_DIR"
echo ""
echo "  Management:"
echo "    pm2 status moinsbete          # Check status"
echo "    pm2 logs moinsbete --lines 50  # View logs"
echo "    pm2 restart moinsbete          # Restart"
echo ""
echo "  Maintenance:"
echo "    Backup: cp $INSTALL_DIR/dev.db \"/srv/http/moinsbete/dev.db.\$(date +%Y%m%d)\""
echo "    Update: cd $INSTALL_DIR && git pull && npm ci --production && npm run build && pm2 restart moinsbete"
echo ""
echo "=============================================="
echo ""

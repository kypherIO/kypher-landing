#!/usr/bin/env bash
# =============================================================================
# Bible Bot — one-shot VPS bootstrap
#
# Target: Ubuntu 24.04 LTS, 1 vCPU / 1 GB RAM / 20 GB disk, KVM.
# Serves https://kypher.cc from /var/www/biblebot via Caddy.
#
# Safe to re-run: every step is idempotent.
#
# Usage (as root):
#   bash bootstrap.sh
#   DOMAIN=example.com bash bootstrap.sh        # different domain
#   SKIP_CLAUDE=1 bash bootstrap.sh             # don't install Claude Code
# =============================================================================
set -euo pipefail

DOMAIN="${DOMAIN:-kypher.cc}"
APP_DIR="${APP_DIR:-/var/www/biblebot}"
REPO="${REPO:-https://github.com/kypherIO/kypher-landing.git}"
BRANCH="${BRANCH:-main}"
ADMIN_EMAIL="${ADMIN_EMAIL:-rod@kypher.io}"
SKIP_CLAUDE="${SKIP_CLAUDE:-0}"

log()  { printf '\n\033[1;36m==>\033[0m \033[1m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this as root."

export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
log "1/9  Base packages"
apt-get update -qq
apt-get install -y -qq \
  ca-certificates curl gnupg git rsync ufw fail2ban unattended-upgrades \
  debian-keyring debian-archive-keyring apt-transport-https tzdata >/dev/null

# ---------------------------------------------------------------------------
log "2/9  Swap (1 GB RAM needs it — prevents OOM during builds/updates)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
  sysctl -p /etc/sysctl.d/99-swappiness.conf >/dev/null
  echo "  swap created (2 GB)"
else
  echo "  swap already present"
fi

# ---------------------------------------------------------------------------
log "3/9  Firewall (UFW): allow SSH, HTTP, HTTPS"
ufw allow 22/tcp   >/dev/null
ufw allow 80/tcp   >/dev/null
ufw allow 443/tcp  >/dev/null
ufw --force enable >/dev/null
ufw status verbose | sed 's/^/  /'

# ---------------------------------------------------------------------------
log "4/9  fail2ban (brute-force protection for SSH)"
cat >/etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true
EOF
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban || true

# ---------------------------------------------------------------------------
log "5/9  Automatic security updates"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
log "6/9  Caddy web server"
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy >/dev/null
fi
caddy version | sed 's/^/  /'

# ---------------------------------------------------------------------------
log "7/9  Deploy site to ${APP_DIR}"
mkdir -p "$APP_DIR" /var/log/caddy /opt/biblebot
if [ -d /opt/biblebot/repo/.git ]; then
  git -C /opt/biblebot/repo fetch --depth 1 origin "$BRANCH" -q
  git -C /opt/biblebot/repo reset --hard "origin/${BRANCH}" -q
else
  rm -rf /opt/biblebot/repo
  git clone --depth 1 --branch "$BRANCH" "$REPO" /opt/biblebot/repo -q \
    || die "Clone failed. If the repo is private, add a deploy key first (see DEPLOY.md)."
fi

# Copy only what the browser needs — no git metadata, no deploy scripts.
rsync -a --delete \
  --exclude '.git' --exclude 'deploy' --exclude 'README.md' \
  /opt/biblebot/repo/ "$APP_DIR"/
chown -R caddy:caddy "$APP_DIR" /var/log/caddy
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;
echo "  $(find "$APP_DIR" -type f | wc -l) files, $(du -sh "$APP_DIR" | cut -f1)"

# ---------------------------------------------------------------------------
log "8/9  Caddy site config for ${DOMAIN}"
install -m 644 /opt/biblebot/repo/deploy/Caddyfile /etc/caddy/Caddyfile
if [ "$DOMAIN" != "kypher.cc" ]; then
  sed -i "s/kypher\.cc/${DOMAIN}/g" /etc/caddy/Caddyfile
fi
sed -i "1i {\n\temail ${ADMIN_EMAIL}\n}\n" /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1 \
  || die "Caddyfile failed validation."
systemctl enable caddy >/dev/null 2>&1 || true
systemctl reload caddy 2>/dev/null || systemctl restart caddy
sleep 2
systemctl is-active --quiet caddy && echo "  caddy is running" || die "caddy failed to start: journalctl -u caddy -n 50"

# ---------------------------------------------------------------------------
log "9/9  Claude Code on the server (optional)"
if [ "$SKIP_CLAUDE" = "1" ]; then
  echo "  skipped (SKIP_CLAUDE=1)"
else
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null
  fi
  npm install -g @anthropic-ai/claude-code >/dev/null 2>&1 \
    && echo "  claude installed — run 'claude' on the server to log in" \
    || warn "Claude Code install failed (non-fatal). Install later: npm i -g @anthropic-ai/claude-code"
fi

# ---------------------------------------------------------------------------
cat <<EOF

$(printf '\033[1;32m')────────────────────────────────────────────────────────────$(printf '\033[0m')
 Bible Bot is deployed.

   Site      https://${DOMAIN}
   Files     ${APP_DIR}
   Config    /etc/caddy/Caddyfile
   Logs      journalctl -u caddy -f
   Redeploy  bash /opt/biblebot/repo/deploy/update.sh

 DNS must point at this server for HTTPS to issue:
   A     @      $(curl -s --max-time 5 https://api.ipify.org || echo 'YOUR_SERVER_IP')
   A     www    $(curl -s --max-time 5 https://api.ipify.org || echo 'YOUR_SERVER_IP')

 Certificates are issued on first request once DNS resolves.
$(printf '\033[1;32m')────────────────────────────────────────────────────────────$(printf '\033[0m')
EOF

#!/usr/bin/env bash
# Pull the latest site and publish it. Run any time you push to main.
#   bash /opt/biblebot/repo/deploy/update.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/biblebot}"
REPO_DIR="${REPO_DIR:-/opt/biblebot/repo}"
BRANCH="${BRANCH:-main}"

[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }
[ -d "$REPO_DIR/.git" ] || { echo "No repo at $REPO_DIR — run bootstrap.sh first." >&2; exit 1; }

echo "==> Fetching ${BRANCH}"
git -C "$REPO_DIR" fetch --depth 1 origin "$BRANCH" -q
OLD=$(git -C "$REPO_DIR" rev-parse HEAD)
git -C "$REPO_DIR" reset --hard "origin/${BRANCH}" -q
NEW=$(git -C "$REPO_DIR" rev-parse HEAD)

if [ "$OLD" = "$NEW" ]; then
  echo "    already up to date ($(git -C "$REPO_DIR" rev-parse --short HEAD))"
else
  echo "    ${OLD:0:7} -> ${NEW:0:7}"
fi

echo "==> Publishing to ${APP_DIR}"
rsync -a --delete \
  --exclude '.git' --exclude 'deploy' --exclude 'README.md' \
  "$REPO_DIR"/ "$APP_DIR"/
chown -R caddy:caddy "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;

# Bump the service-worker cache name so returning visitors pick up
# the new build instead of being served the old one from cache.
SW="$APP_DIR/sw.js"
if [ -f "$SW" ]; then
  STAMP=$(date +%Y%m%d%H%M%S)
  sed -i "s/^const CACHE_NAME = .*/const CACHE_NAME = 'bible-bot-${STAMP}';/" "$SW"
  echo "    service worker cache -> bible-bot-${STAMP}"
fi

echo "==> Reloading Caddy"
systemctl reload caddy
echo "Done. https://$(grep -m1 -oP '^[a-z0-9.-]+\.[a-z]{2,}(?= \{)' /etc/caddy/Caddyfile || echo kypher.cc)"

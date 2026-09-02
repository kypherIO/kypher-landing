#!/usr/bin/env bash
# Publish the CoreTrust Lead Gen dashboard + workbook to their own, separate,
# password-gated directory. Never touches /var/www/biblebot (the public
# site) and is never invoked by deploy/update.sh.
#
# One-time server setup before the first run:
#   1. Set the basic_auth password hash as an environment variable Caddy's
#      systemd unit can see (NOT in the Caddyfile, NOT in git):
#        systemctl edit caddy
#      Add:
#        [Service]
#        Environment="CORETRUST_AUTH_HASH=<the bcrypt hash>"
#      Then: systemctl daemon-reload && systemctl restart caddy
#   2. Run this script.
#
#   bash /opt/biblebot/repo/deploy/update-coretrust.sh
set -euo pipefail

APP_DIR="${CORETRUST_APP_DIR:-/var/www/coretrust-leadgen}"
REPO_DIR="${REPO_DIR:-/opt/biblebot/repo}"
SRC="$REPO_DIR/coretrust-leadgen"

[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }
[ -d "$SRC" ] || { echo "No coretrust-leadgen/ at $SRC — pull the latest repo first." >&2; exit 1; }

mkdir -p "$APP_DIR"

echo "==> Publishing dashboard + workbook to ${APP_DIR}"
install -m 644 "$SRC/deploy/portal-index.html" "$APP_DIR/index.html"
install -m 644 "$SRC/dashboard/CoreTrust_Activity_Dashboard.html" "$APP_DIR/dashboard.html"
install -m 644 "$SRC/data/CoreTrust_Master_Members.xlsx" "$APP_DIR/CoreTrust_Master_Members.xlsx"

chown -R caddy:caddy "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;

echo "==> Reloading Caddy"
systemctl reload caddy
echo "Done. https://kypher.cc/coretrust-leadgen/ (login required)"

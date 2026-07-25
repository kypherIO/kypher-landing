#!/usr/bin/env bash
# =============================================================================
# Switch SSH from password login to key-only.
#
# IMPORTANT: run this only AFTER you have added your public key and
# confirmed you can log in with it from a SECOND terminal. If you lock
# yourself out you'll need console access from your VPS provider.
#
#   # 1. From YOUR laptop:
#   ssh-keygen -t ed25519 -C "you@example.com"          # if you have no key
#   ssh-copy-id root@172.245.89.123
#
#   # 2. Open a NEW terminal and verify key login works:
#   ssh root@172.245.89.123
#
#   # 3. Only then, on the server:
#   bash harden-ssh.sh
# =============================================================================
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }

KEYS="${HOME}/.ssh/authorized_keys"
if [ ! -s "$KEYS" ]; then
  echo "REFUSING: $KEYS is missing or empty." >&2
  echo "Add your public key first, or you will be locked out." >&2
  exit 1
fi
echo "Found $(grep -cvE '^\s*(#|$)' "$KEYS") authorized key(s)."
read -rp "Disable password login now? [type YES to confirm] " ans
[ "$ans" = "YES" ] || { echo "Aborted."; exit 0; }

cp /etc/ssh/sshd_config "/etc/ssh/sshd_config.bak.$(date +%s)"
mkdir -p /etc/ssh/sshd_config.d
cat >/etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password
MaxAuthTries 3
EOF

sshd -t || { echo "sshd config test failed — reverting." >&2; rm -f /etc/ssh/sshd_config.d/99-hardening.conf; exit 1; }
systemctl reload ssh 2>/dev/null || systemctl reload sshd
echo
echo "Password login disabled. Keep this session open and verify a new"
echo "key-based login works before closing it."

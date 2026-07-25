# Deploying Bible Bot to your VPS

Target server: **Ubuntu 24.04 LTS · 1 vCPU · 1 GB RAM · 20 GB disk · KVM**
Domain: **kypher.cc**

---

## ⚠️ Read this first

You shared your root password in a chat message. Treat it as compromised:

```bash
passwd root          # set a new one, right now
```

Then follow **Step 5** below to move to SSH keys and turn password login
off entirely. Until you do, anyone with that password has full control of
the box — and Internet-facing SSH on port 22 gets brute-forced constantly.

---

## About the database

**This app doesn't need one, and on a 1 GB server you don't want one.**

Bible Bot is fully static: all 3 Bible translations, the study notes, the
planner content, the map and timeline data are plain JSON files the browser
downloads once. Search, the planners, the geolocator and audio all run
client-side. Nothing is stored server-side — plan progress lives in the
visitor's own `localStorage`.

For scale: idle PostgreSQL uses ~100–200 MB RAM and MySQL ~400 MB. On a
1 GB box that's 10–40% of your memory doing nothing. Installing one
"because production sites have databases" would make the site slower and
more fragile, not more real.

If you later add something that genuinely needs persistence — a feedback
form that stores submissions, saved accounts, a prayer wall — the right
choice at this size is **SQLite**: a single file, no daemon, no memory
overhead. `deploy/optional-feedback-api/` has a working example you can
turn on when you actually need it. Until then, skip it.

---

## Step 1 — Point DNS at the server

At your domain registrar for `kypher.cc`, create two **A** records:

| Type | Name  | Value             | TTL  |
|------|-------|-------------------|------|
| A    | `@`   | `172.245.89.123`  | 3600 |
| A    | `www` | `172.245.89.123`  | 3600 |

Do this **before** Step 3 — Let's Encrypt validates over HTTP, so the
domain has to resolve to the server before a certificate can be issued.

Check propagation (from your laptop):

```bash
dig +short kypher.cc
# should print 172.245.89.123
```

DNS can take anywhere from a minute to a few hours.

---

## Step 2 — Log in

```bash
ssh root@172.245.89.123
```

---

## Step 3 — Run the bootstrap

One command. Idempotent — safe to re-run any time.

```bash
curl -fsSL https://raw.githubusercontent.com/kypherIO/kypher-landing/main/deploy/bootstrap.sh -o bootstrap.sh
less bootstrap.sh          # read it before running it
bash bootstrap.sh
```

What it does:

| Step | Action |
|------|--------|
| 1 | Base packages |
| 2 | **2 GB swap** — essential at 1 GB RAM, prevents OOM kills |
| 3 | **UFW firewall** — only 22 / 80 / 443 open |
| 4 | **fail2ban** — bans SSH brute-forcers after 5 tries |
| 5 | **Unattended security upgrades** |
| 6 | **Caddy** — lightweight web server, automatic HTTPS |
| 7 | Clones the repo, publishes to `/var/www/biblebot` |
| 8 | Installs the site config, starts Caddy |
| 9 | Installs **Claude Code** on the server (skip with `SKIP_CLAUDE=1`) |

Takes about 3–5 minutes. HTTPS is issued automatically on the first
request once DNS resolves.

**If the repo is still private**, either make it public, or add a deploy key:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
cat /root/.ssh/deploy_key.pub
# → paste into GitHub: Repo → Settings → Deploy keys → Add (read-only)
cat >> /root/.ssh/config <<'EOF'
Host github.com
  IdentityFile /root/.ssh/deploy_key
  StrictHostKeyChecking accept-new
EOF
REPO=git@github.com:kypherIO/kypher-landing.git bash bootstrap.sh
```

---

## Step 4 — Verify

```bash
systemctl status caddy --no-pager
curl -I https://kypher.cc
journalctl -u caddy -n 30 --no-pager
```

You want `HTTP/2 200`. Then open **https://kypher.cc** in a browser and
check: search returns verses, the planner builds a week, the map renders,
and the padlock is green.

---

## Step 5 — Lock down SSH (do this today)

From **your laptop**:

```bash
ssh-keygen -t ed25519 -C "rod@kypher.cc"     # skip if you already have a key
ssh-copy-id root@172.245.89.123
```

Open a **second terminal** and confirm `ssh root@172.245.89.123` logs you
in without a password. Only once that works, on the server:

```bash
bash /opt/biblebot/repo/deploy/harden-ssh.sh
```

It refuses to run if no authorized key is present, so it can't lock you
out by accident. Keep your existing session open until you've verified a
fresh login still works.

---

## Step 6 — Get indexed by Google

1. **Google Search Console** → <https://search.google.com/search-console>
   Add property `https://kypher.cc`, verify via DNS TXT record, then
   submit `https://kypher.cc/sitemap.xml`.
2. **Bing Webmaster Tools** → <https://www.bing.com/webmasters> (you can
   import directly from Search Console).
3. Confirm the crawler files are live:
   ```bash
   curl https://kypher.cc/robots.txt
   curl https://kypher.cc/sitemap.xml
   ```
4. Check the link preview card renders — paste `https://kypher.cc` into
   <https://www.opengraph.xyz/> or just send it to yourself in iMessage
   or Slack.

Indexing usually takes a few days to a couple of weeks. Nothing else to do.

---

## Updating the site

After you push to `main`:

```bash
ssh root@172.245.89.123
bash /opt/biblebot/repo/deploy/update.sh
```

It pulls, republishes, bumps the service-worker cache name (so returning
visitors don't get a stale cached build), and reloads Caddy.

**Auto-deploy every 10 minutes** instead, if you want:

```bash
sudo tee /etc/systemd/system/biblebot-update.service >/dev/null <<'EOF'
[Unit]
Description=Update Bible Bot from git
[Service]
Type=oneshot
ExecStart=/bin/bash /opt/biblebot/repo/deploy/update.sh
EOF

sudo tee /etc/systemd/system/biblebot-update.timer >/dev/null <<'EOF'
[Unit]
Description=Check for Bible Bot updates
[Timer]
OnBootSec=5min
OnUnitActiveSec=10min
[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now biblebot-update.timer
```

---

## Letting Claude manage the server

The bootstrap installs Claude Code on the VPS. To use it:

```bash
ssh root@172.245.89.123
claude          # first run walks you through login
```

Now you can just talk to it on the box:

- *"Caddy is throwing 502s, check the logs and fix it"*
- *"Set up the auto-deploy timer"*
- *"Why is memory usage high?"*
- *"Add a staging subdomain at beta.kypher.cc"*

It has root, so it can read logs, edit configs, and restart services
directly. Give it specific goals and let it verify its own work with
`systemctl` and `curl`.

A safer pattern once things are stable — run it as a non-root user with
sudo, rather than as root:

```bash
adduser rod && usermod -aG sudo rod
# then: ssh rod@172.245.89.123 && claude
```

---

## Operations cheat sheet

```bash
# service
systemctl {status,reload,restart} caddy
journalctl -u caddy -f                     # live logs
tail -f /var/log/caddy/kypher.cc.log       # access logs

# config
caddy validate --config /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile

# health
free -h                # memory + swap
df -h /                # disk
uptime                 # load
fail2ban-client status sshd
ufw status verbose

# certificates (Caddy renews automatically)
ls /var/lib/caddy/.local/share/caddy/certificates/
```

### If HTTPS won't issue

Almost always DNS. Check in order:

```bash
dig +short kypher.cc                  # must be 172.245.89.123
ufw status | grep 80                  # port 80 must be open for validation
journalctl -u caddy | grep -i acme    # the actual error
```

Let's Encrypt rate-limits to 5 failures per hour per domain — if you hit
it, fix DNS and wait an hour rather than retrying in a loop.

### If the site is slow or the box feels stuck

```bash
free -h                               # is swap being hammered?
systemctl restart caddy
```

At 1 GB, the usual culprit is something other than Caddy eating RAM —
Caddy serving static files idles around 20–40 MB.

---

## What's running, and what it costs you

| Component | Purpose | Idle RAM |
|-----------|---------|----------|
| Caddy | web server + auto-TLS | ~20–40 MB |
| fail2ban | SSH brute-force bans | ~15 MB |
| systemd + base OS | — | ~150 MB |
| **Total** | | **~200 MB of 1 GB** |

That leaves plenty of headroom. The site itself is ~13 MB of static files
served straight off disk, cached hard by the browser after first visit.

# Optional: SQLite feedback API

**You don't need this to run Bible Bot.** The site is fully static and the
footer's "Email Rod" link works without any backend. Turn this on only if
you'd rather have suggestions land in a database on the server than in
your inbox.

Why SQLite and not Postgres/MySQL: this stores a few short text rows. SQLite
is a single file with no daemon and effectively zero idle memory. Postgres
would idle at 100–200 MB and MySQL at ~400 MB — a bad trade on a 1 GB box.
Python's standard library is used throughout, so there are no dependencies
to install or keep patched.

## Install

```bash
# 1. Put the service in place
sudo mkdir -p /opt/biblebot /var/lib/biblebot
sudo cp /opt/biblebot/repo/deploy/optional-feedback-api/feedback_api.py /opt/biblebot/
sudo chown -R caddy:caddy /var/lib/biblebot

# 2. Run it under systemd
sudo tee /etc/systemd/system/biblebot-feedback.service >/dev/null <<'EOF'
[Unit]
Description=Bible Bot feedback API
After=network.target

[Service]
Type=simple
User=caddy
Group=caddy
Environment=FEEDBACK_DB=/var/lib/biblebot/feedback.db
ExecStart=/usr/bin/python3 /opt/biblebot/feedback_api.py
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/biblebot

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now biblebot-feedback
sudo systemctl status biblebot-feedback --no-pager
```

## Expose it through Caddy

Add this inside the `kypher.cc { … }` block in `/etc/caddy/Caddyfile`,
above `file_server`:

```caddyfile
	# Feedback API — POST only; reads stay loopback-only.
	@feedback {
		path /api/feedback
		method POST
	}
	handle @feedback {
		reverse_proxy 127.0.0.1:8081
	}
```

Then:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Test

```bash
curl -X POST https://kypher.cc/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"message":"Love the planner!","email":"someone@example.com"}'
# → {"ok": true}

# Read submissions (server-side only)
curl -s localhost:8081/api/feedback | python3 -m json.tool
```

## Back it up

The whole database is one file:

```bash
sudo sqlite3 /var/lib/biblebot/feedback.db ".backup '/root/feedback-$(date +%F).db'"
```

Or nightly:

```bash
sudo tee /etc/cron.daily/biblebot-backup >/dev/null <<'EOF'
#!/bin/sh
sqlite3 /var/lib/biblebot/feedback.db ".backup '/root/feedback-$(date +%F).db'"
find /root -name 'feedback-*.db' -mtime +14 -delete
EOF
sudo chmod +x /etc/cron.daily/biblebot-backup
```

## Wiring the front end

The footer currently uses a `mailto:` link. To post here instead, swap the
anchor for a small form and:

```js
await fetch('/api/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, email }),
});
```

Handle `429` (rate limited, 20s between posts per IP) and `400`
(validation) by showing the returned `error` string to the user.

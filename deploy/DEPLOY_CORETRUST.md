# Deploying CoreTrust Lead Gen to kypher.cc (private, password-gated)

This publishes `dashboard/CoreTrust_Activity_Dashboard.html` and
`data/CoreTrust_Master_Members.xlsx` to `https://kypher.cc/coretrust-leadgen/`
as a **mirror**, not the primary copy — OneDrive stays the file Copilot
Studio and the rep edit day to day (see the root `coretrust-leadgen/README.md`,
"Where the file lives"). Use this when you want a link you can open from any
browser without OneDrive signed in.

It is deliberately isolated from the public Bible Bot site:

- Served from its own directory, `/var/www/coretrust-leadgen`, never
  `/var/www/biblebot` -- `deploy/update.sh` (the Bible Bot publish script)
  now explicitly excludes `coretrust-leadgen/` from what it syncs, so a
  routine Bible Bot update can never leak this data onto the public site.
- Gated by HTTP Basic Auth (`handle_path /coretrust-leadgen/*` in
  `deploy/Caddyfile`) -- one login, one user (`rod`).
- Marked `noindex, nofollow, noarchive` and disallowed in `robots.txt`, so
  even if a link leaked, search engines won't index it. (Basic Auth alone
  already keeps crawlers out -- they get a 401 -- this is defense in depth.)
- The password hash is **not** in this repository, in the Caddyfile, or
  anywhere in git history. It lives only as a systemd environment variable
  on the server, referenced from the Caddyfile as `{$CORETRUST_AUTH_HASH}`.

## One-time server setup

You'll do this once, as root on the VPS, after `bootstrap.sh` has already
set up Caddy (see `deploy/DEPLOY.md`).

1. **Set the password hash as an environment variable for the Caddy
   service** -- not in any file that gets committed:
   ```bash
   systemctl edit caddy
   ```
   This opens an override file. Add:
   ```ini
   [Service]
   Environment="CORETRUST_AUTH_HASH=<the bcrypt hash Claude gave you in chat>"
   ```
   Save and exit, then:
   ```bash
   systemctl daemon-reload
   systemctl restart caddy
   ```
2. **Publish the files:**
   ```bash
   bash /opt/biblebot/repo/deploy/update-coretrust.sh
   ```
3. **Verify:** visit `https://kypher.cc/coretrust-leadgen/` -- the browser
   should prompt for a username and password before showing anything.
   Username `rod`, the password you already have. Confirm an incognito /
   logged-out request gets a 401, and that
   `https://kypher.cc/coretrust-leadgen/CoreTrust_Master_Members.xlsx`
   also prompts (not just the index page).

## Keeping it current

Re-run `bash /opt/biblebot/repo/deploy/update-coretrust.sh` any time you
want the VPS mirror to catch up to a newer `data/CoreTrust_Master_Members.xlsx`
or dashboard build (after pulling the latest repo, same as `update.sh`).
It does not run automatically -- unlike the public site, there's no reason
to auto-publish a file that may contain in-progress, unreviewed edits.

## Rotating the password

Generate a new bcrypt hash (any of these work, Caddy accepts standard
bcrypt hashes regardless of which tool made them):
```bash
# with Caddy itself, if installed:
caddy hash-password

# or with Apache's htpasswd (bcrypt mode), printing the hash only:
htpasswd -nbB rod 'your-new-password' | cut -d: -f2
```
Then update the `CORETRUST_AUTH_HASH` value in `systemctl edit caddy` (same
steps as above) and `systemctl daemon-reload && systemctl restart caddy`.
Never put the plaintext password or the hash in a commit, an issue, or a
chat message you don't intend to rotate afterward -- treat this doc's
"paste the hash here" step as the only place it should ever transit through
text you don't control.

## If you'd rather not host it on the VPS at all

This whole file is optional. The dashboard and workbook work identically
opened straight from OneDrive or a local copy -- nothing about Copilot
Studio, the pipeline scripts, or the agent flows depends on this VPS
mirror existing. Skip this document entirely if OneDrive-only is enough.

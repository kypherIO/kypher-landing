# Bible Bot — Search Scripture, Listen, Plan

A personal project by Rod Andrews. A free, fast, client-side Bible app: type
a word, a feeling, or a goal, and find matching verses, listen to them read
aloud, build a weekly growth plan around them, or explore Scripture by
ancient geography.

No backend, no database, no build step — it's a static site that runs
entirely in the browser, and it's installable as a PWA on any phone,
tablet, or desktop.

## Features

### Search
- **Instant word/phrase search** across all 66 books (~31,000 verses),
  with live results as you type.
- **Three translations** — King James Version, World English Bible, and
  Berean Standard Bible, all public domain. (BSB is the closest free reading
  to the NIV; the NIV itself is copyrighted by Biblica/Zondervan and can't
  be legally bundled.) Switch with one click; translations load in the
  background so switching feels instant.
- **Filters** by testament (Old/New) and by book, plus sort by Bible order
  or relevance.
- **Listen** — verses and full chapters read aloud via the browser's
  built-in Web Speech API (adjustable speed, no audio files or server).
- **Study notes** — a curated dictionary of ~90 biblical themes surfaces a
  short, non-denominational explanation of how a searched word is used in
  Scripture.
- **"How are you feeling?"** — a dedicated prompt on the landing page,
  separate from literal word search, for describing how you're feeling in
  your own words (a full sentence works, not just a single word) and getting
  matching verses back. Covers 25 categories spanning hard emotions
  (anxious, afraid, discouraged, lonely, overwhelmed, guilty, grieving...),
  good ones worth building on (joyful, grateful, hopeful, confident,
  at peace...), and specific situations (job loss, health, relationship
  conflict, financial stress, grief, temptation, big decisions...), with a
  graceful general-encouragement fallback so it never dead-ends.
- **Share as image** — turn any verse into a branded, Instagram-ready
  square image, shared straight to your phone's native share sheet (or
  downloaded on desktop).

### Weekly Planner & Pastor Planner (separate tabs)
- **Weekly Planner**: answer one prompt ("What do you want to biblically
  accomplish to grow with God this week?") and get a full week: a memory
  verse, and daily verses, reflections, prayer prompts, and one small action
  per day — dated to the actual current week, with per-day progress
  checkboxes.
- **Pastor Planner**: its own tab, built the same way but from a sermon —
  the sermon's theme, the verses your pastor mentioned, and a few keywords.
  The sermon's own verses are slotted into the week and badged "From the
  sermon," with supporting days drawn from the same theme library. Each
  planner keeps its own plan independently, so switching tabs doesn't lose
  either one.
- Every plan can be **copied as plain text**, **printed/saved as a PDF**, or
  turned into a **shareable link** that regenerates the same plan for
  whoever opens it — no account or backend involved.

### Bible Geolocator
- A real, zoomable map. Coastlines, country borders, lakes (incl. the Dead
  Sea) and rivers (Nile, Jordan, Tigris, Euphrates) come from Natural Earth
  50m data (public domain), stored as raw lon/lat and reprojected on the
  fly — so the same dataset draws both the overview and each zoomed-in
  region.
- Click one of the 7 regions and the map **zooms to that region** with a
  labelled, tappable pin on every place in it — Nineveh, Babylon and Ur sit
  along the Tigris and Euphrates where they actually are. Click a pin (or a
  card) for the verses tied to that ground.

### History Timeline
- A vertical timeline from the Patriarchs (c. 2000 BC) through the early
  church (c. 100 AD) — ten eras, each tagged with the surrounding
  civilization (Egypt, Assyria, Babylon, Persia, Greece, Rome). Click an
  era to see its key events, then an event for the verses tied to it.
  Dates are approximate and traditional — meant for orientation, not a
  scholarly chronology.

### Built for short attention and short weeks
- **"Just today"** on both planners collapses the week to the single day
  you're on, so the plan never shows more than one thing to act on.
- One small, concrete action per day rather than open-ended reading.
- Collapsible days with only today expanded by default; progress bar and
  per-day checkboxes that persist locally.
- Large tap targets (44px nav, 40px buttons, 22px checkboxes), adjustable
  text size, and `prefers-reduced-motion` respected throughout.

### Everywhere
- **Light/dark theme**, adjustable text size, responsive layout that works
  on phone, tablet, and desktop.
- Installable as a **PWA** — "Add to Home Screen" gives it an app icon and
  offline access via a service worker; no App Store/Play Store account
  needed.
- SEO basics in place: meta description, Open Graph/Twitter card image,
  JSON-LD, `sitemap.xml`, `robots.txt`.

## Running locally

Because the app fetches JSON data files, open it through a local web server
rather than as a `file://` URL:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Any static file server works (`npx serve`, VS Code Live Server, etc.).

## Deploying

This is a fully static site — no build step, no runtime, no database.

**On your own VPS (kypher.cc):** see **[`deploy/DEPLOY.md`](deploy/DEPLOY.md)**
for the full walkthrough. Short version, as root on a fresh Ubuntu 24.04 box:

```bash
curl -fsSL https://raw.githubusercontent.com/kypherIO/kypher-landing/main/deploy/bootstrap.sh -o bootstrap.sh
bash bootstrap.sh
```

That installs Caddy with automatic HTTPS, a firewall, fail2ban, swap
(important at 1 GB RAM), unattended security upgrades, publishes the site,
and optionally installs Claude Code on the server so you can manage it
conversationally afterwards.

**Anywhere else:** deploy the repo as-is to GitHub Pages, Netlify, Vercel,
or Cloudflare Pages. If you use a domain other than `kypher.cc`, update the
URL in `index.html` (canonical, Open Graph/Twitter, JSON-LD) plus
`sitemap.xml` and `robots.txt`.

### About the native mobile app

This build ships as a PWA rather than a native iOS/Android app: it's
installable from the browser (Safari/Chrome → "Add to Home Screen") and
behaves like an app — icon, full-screen, offline — with no developer
account or app store review required. A true App Store/Play Store listing
is a separate step that needs your own Apple Developer ($99/yr) and Google
Play ($25 one-time) accounts, since publishing has to happen under your own
identity. The practical path there is wrapping this same web app with a
tool like Capacitor and submitting it yourself (or asking for help once you
have those accounts) — the app would still just be "an optimized viewer"
over this same code, as intended.

## Project structure

```
index.html                  Page markup (search, planner, and geolocator views)
styles.css                   Styling (light/dark theme, adjustable text size,
                               responsive + print layout)
app.js                        Search, audio, translation switching, study notes,
                                chapter view, comfort search, weekly/pastor planner,
                                Bible Geolocator, shareable verse images
manifest.json                 PWA manifest
sw.js                          Service worker (offline caching)
icons/                         PWA app icons
social-card.png                Open Graph / social share image
sitemap.xml, robots.txt        SEO
data/bible-kjv.json            King James Version text (public domain)
data/bible-web.json            World English Bible text (public domain)
data/bible-bsb.json            Berean Standard Bible text (public domain)
data/books-meta.json           Book names, abbreviations, testament, genre
data/study-themes.json         Curated theme/keyword study notes
data/comfort-topics.json       Emotion → curated comfort verses + framing
data/growth-themes.json        Weekly growth tracks (memory verse + 7 days each)
data/geo-regions.json          Bible Geolocator regions, locations, and verses
data/world-outline.json        Real coastline/border paths (Natural Earth, public domain)
data/timeline-eras.json        History Timeline eras, events, and verses
deploy/bootstrap.sh            One-shot VPS setup (Caddy, TLS, firewall, swap)
deploy/update.sh               Pull latest and republish
deploy/harden-ssh.sh           Switch SSH to key-only auth
deploy/Caddyfile               Web server config
deploy/DEPLOY.md               Full deployment walkthrough
deploy/optional-feedback-api/  Optional SQLite feedback endpoint (off by default)
```

## Data & credits

- Bible text: King James Version, World English Bible, and Berean Standard
  Bible — all public domain.
- Audio is generated on-demand in your browser via the Web Speech API —
  nothing is uploaded, recorded, or stored.
- Study notes and the Weekly Planner's growth tracks are original, brief,
  non-denominational content meant as a starting point for reflection, not
  authoritative theological commentary.
- Built by Rod Andrews (rod@kypher.io).

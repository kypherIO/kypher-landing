# Bible Bot — Search Scripture, Listen, Understand

A free, fast, client-side Bible search engine. Type a word, name, or short
phrase and instantly find every matching verse in the King James Version or
World English Bible, listen to verses read aloud, jump into full chapters
for context, and open a short study note explaining how that word or theme
is used across Scripture.

No backend, no database, no build step — it's a static site that runs
entirely in the browser.

## Features

- **Instant word/phrase search** across all 66 books (~31,000 verses),
  with live results as you type.
- **Two translations** — switch between the King James Version and the
  World English Bible (both public domain) with one click; the second
  translation loads in the background so switching feels instant.
- **Filters** by testament (Old/New) and by book, plus sort by Bible order
  or relevance.
- **Listen** — verses and full chapters can be read aloud using the
  browser's built-in Web Speech API (adjustable speed, no audio files or
  server required).
- **Study notes** — a curated dictionary of ~90 biblical themes (love,
  faith, grace, forgiveness, justice, etc.) surfaces a short, non-denominational
  explanation of how a searched word/theme is used in Scripture, plus related
  themes found in the same verse.
- **Read chapter** — opens the full chapter in context with the matched
  verse highlighted.
- **Comfort search** — type how you're feeling (anxious, afraid, discouraged,
  lonely, overwhelmed, guilty, grieving, etc.) and a curated set of verses
  and a short comforting note surface above the regular results.
- **Weekly Planner** — answer one prompt ("What do you want to biblically
  accomplish to grow with God this week?") and get a full week: a memory
  verse, and daily verses, reflections, prayer prompts, and one small action
  per day — dated to the actual current week, with per-day progress
  checkboxes that persist locally.
- **Pastor Planner** — build the same weekly plan from a sermon instead of a
  personal goal: enter what your pastor preached on, which verses they
  mentioned, and a few keywords, and it slots the sermon's own verses into
  the week alongside supporting content from the same theme library.
- Every plan can be **copied as plain text**, **printed/saved as a PDF**
  (isolated print layout via `window.print()`), or turned into a
  **shareable link** that regenerates the same plan — with dates recomputed
  to whoever opens it — with no account or backend involved.
- **Light/dark theme**, responsive layout, shareable search URLs (`?q=...`).

## Running locally

Because the app fetches JSON data files, open it through a local web server
rather than as a `file://` URL:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Any static file server works (`npx serve`, VS Code Live Server, etc.).

## Deploying

This is a fully static site — deploy the repository as-is to GitHub Pages,
Netlify, Vercel, Cloudflare Pages, or any static host. There are no
environment variables or build steps required.

## Project structure

```
index.html                  Page markup (search view + planner view)
styles.css                   Styling (light/dark theme, responsive + print layout)
app.js                        Search, audio, translation switching, study notes,
                                chapter view, comfort search, weekly/pastor planner
data/bible-kjv.json            King James Version text (public domain)
data/bible-web.json            World English Bible text (public domain)
data/books-meta.json           Book names, abbreviations, testament, genre
data/study-themes.json         Curated theme/keyword study notes
data/comfort-topics.json       Emotion → curated comfort verses + framing
data/growth-themes.json        Weekly growth tracks (memory verse + 7 days each)
```

## Data & credits

- Bible text: King James Version and World English Bible, both public
  domain. (The NIV is copyrighted by Biblica/Zondervan and isn't bundled —
  the WEB was chosen as a modern-English public-domain alternative.)
- Audio is generated on-demand in your browser via the Web Speech API —
  nothing is uploaded, recorded, or stored.
- Study notes are original, brief, non-denominational summaries meant as a
  starting point for reflection, not authoritative theological commentary.

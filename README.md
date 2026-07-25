# Kypher — Bible Search, Read & Study

A free, fast, client-side Bible search engine. Type a word, name, or short
phrase and instantly find every matching verse in the King James Version,
listen to verses read aloud, jump into full chapters for context, and open a
short study note explaining how that word or theme is used across Scripture.

No backend, no database, no build step — it's a static site that runs
entirely in the browser.

## Features

- **Instant word/phrase search** across all 66 books (~31,000 verses),
  with live results as you type.
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
index.html          Page markup
styles.css           Styling (light/dark theme, responsive layout)
app.js                Search, audio, study notes, chapter view logic
data/bible-kjv.json    Full King James Bible text (public domain)
data/books-meta.json   Book names, abbreviations, testament, genre
data/study-themes.json Curated theme/keyword study notes
```

## Data & credits

- Bible text: King James Version (public domain).
- Audio is generated on-demand in your browser via the Web Speech API —
  nothing is uploaded, recorded, or stored.
- Study notes are original, brief, non-denominational summaries meant as a
  starting point for reflection, not authoritative theological commentary.

(() => {
  'use strict';

  /* ---------------- Translations ---------------- */
  const TRANSLATIONS = {
    kjv: { label: 'KJV', name: 'King James Version', file: 'data/bible-kjv.json' },
    web: { label: 'WEB', name: 'World English Bible', file: 'data/bible-web.json' },
  };

  /* ---------------- State ---------------- */
  const state = {
    booksMeta: [],
    booksByName: new Map(),
    themes: {},
    themeKeys: [],
    translation: 'kjv',
    bibles: {},          // translation key -> flat verse array (lazily loaded/parsed)
    bibleRaw: {},         // translation key -> raw parsed book/chapter JSON (for chapter lookups)
    query: '',
    testament: 'ALL',
    book: '',
    sort: 'canon',
    results: [],
    shown: 0,
    pageSize: 25,
    rate: 1,
    lastUtteranceBuilder: null,
  };

  const QUICK_TAGS = ['love', 'faith', 'hope', 'peace', 'grace', 'forgiveness', 'fear not', 'wisdom', 'joy', 'strength', 'prayer', 'salvation'];

  /* ---------------- DOM refs ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {
    form: $('#searchForm'),
    input: $('#searchInput'),
    clearBtn: $('#clearBtn'),
    quickTags: $('#quickTags'),
    filters: $('#filters'),
    bookFilter: $('#bookFilter'),
    sortOrder: $('#sortOrder'),
    statusBar: $('#statusBar'),
    results: $('#results'),
    loadMoreWrap: $('#loadMoreWrap'),
    loadMoreBtn: $('#loadMoreBtn'),
    emptyState: $('#emptyState'),
    cardTemplate: $('#verseCardTemplate'),
    themeToggle: $('#themeToggle'),
    translationToggle: $('#translationToggle'),
    modal: $('#chapterModal'),
    modalTitle: $('#chapterModalTitle'),
    modalBody: $('#chapterModalBody'),
    chapterListenBtn: $('#chapterListenBtn'),
    audioBar: $('#audioBar'),
    audioBarLabel: $('#audioBarLabel'),
    audioStopBtn: $('#audioStopBtn'),
    rateSelect: $('#rateSelect'),
  };

  /* ---------------- Utilities ---------------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
  function normalizeQuery(q) {
    return q.trim().replace(/\s+/g, ' ');
  }

  /* ---------------- Data loading ---------------- */
  function flattenBible(bookObjs) {
    const flat = [];
    bookObjs.forEach((bookObj) => {
      const bmeta = state.booksByName.get(bookObj.b) || {};
      bookObj.c.forEach((versesArr, chIdx) => {
        const chapterNum = chIdx + 1;
        versesArr.forEach((text, vIdx) => {
          if (!text) return; // a handful of verses are absent in some translations (manuscript variants)
          flat.push({
            book: bookObj.b,
            abbr: bmeta.abbr || bookObj.b,
            testament: bmeta.testament || 'OT',
            genre: bmeta.genre || '',
            chapter: chapterNum,
            verse: vIdx + 1,
            text,
            textLower: text.toLowerCase(),
          });
        });
      });
    });
    return flat;
  }

  async function loadTranslation(key) {
    if (state.bibles[key]) return state.bibles[key];
    const res = await fetch(TRANSLATIONS[key].file);
    const bookObjs = await res.json();
    state.bibleRaw[key] = bookObjs;
    const flat = flattenBible(bookObjs);
    state.bibles[key] = flat;
    return flat;
  }

  async function loadCoreData() {
    const [metaRes, themesRes] = await Promise.all([
      fetch('data/books-meta.json'),
      fetch('data/study-themes.json'),
    ]);
    const [meta, themes] = await Promise.all([metaRes.json(), themesRes.json()]);
    state.booksMeta = meta;
    meta.forEach(m => state.booksByName.set(m.name, m));
    state.themes = themes;
    state.themeKeys = Object.keys(themes).sort((a, b) => b.length - a.length);
    populateBookFilter();
  }

  function populateBookFilter() {
    const frag = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Any book';
    frag.appendChild(placeholder);
    state.booksMeta.forEach(b => {
      if (state.testament !== 'ALL' && b.testament !== state.testament) return;
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = b.name;
      frag.appendChild(opt);
    });
    els.bookFilter.innerHTML = '';
    els.bookFilter.appendChild(frag);
  }

  /* ---------------- Quick tags ---------------- */
  function renderQuickTags() {
    QUICK_TAGS.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-btn';
      btn.textContent = tag;
      btn.addEventListener('click', () => {
        els.input.value = tag;
        runSearch();
        els.input.focus();
      });
      els.quickTags.appendChild(btn);
    });
  }

  /* ---------------- Search ---------------- */
  function activeVerses() {
    return state.bibles[state.translation] || [];
  }

  function computeResults(query) {
    const q = query.toLowerCase();
    if (!q) return [];
    const qWordBoundary = new RegExp(`\\b${escapeRegExp(q)}\\b`);
    const out = [];
    for (const v of activeVerses()) {
      if (state.testament !== 'ALL' && v.testament !== state.testament) continue;
      if (state.book && v.book !== state.book) continue;
      const idx = v.textLower.indexOf(q);
      if (idx === -1) continue;
      let count = 0;
      let pos = 0;
      while (true) {
        const found = v.textLower.indexOf(q, pos);
        if (found === -1) break;
        count++;
        pos = found + q.length;
      }
      const wholeWord = qWordBoundary.test(v.textLower);
      out.push({ v, score: (wholeWord ? 100 : 0) + count });
    }
    if (state.sort === 'relevance') {
      out.sort((a, b) => b.score - a.score);
    }
    return out.map(o => o.v);
  }

  function runSearch() {
    const q = normalizeQuery(els.input.value);
    state.query = q;
    els.clearBtn.hidden = !q;
    syncUrl();

    if (!q) {
      state.results = [];
      state.shown = 0;
      els.results.innerHTML = '';
      els.loadMoreWrap.hidden = true;
      els.emptyState.hidden = true;
      els.statusBar.textContent = '';
      return;
    }

    state.results = computeResults(q);
    state.shown = 0;
    els.results.innerHTML = '';
    renderMore();
  }

  function renderMore() {
    const q = state.query;
    const remaining = state.results.slice(state.shown, state.shown + state.pageSize);
    remaining.forEach(v => els.results.appendChild(buildVerseCard(v, q)));
    state.shown += remaining.length;

    const total = state.results.length;
    els.emptyState.hidden = total !== 0;
    els.loadMoreWrap.hidden = state.shown >= total;

    const transLabel = TRANSLATIONS[state.translation].label;
    if (total === 0) {
      els.statusBar.textContent = `No results for “${q}” in the ${transLabel}.`;
    } else {
      els.statusBar.textContent = `${total.toLocaleString()} verse${total === 1 ? '' : 's'} found for “${q}” (${transLabel}) — showing ${state.shown.toLocaleString()}.`;
    }
  }

  function highlightText(text, query) {
    const pattern = new RegExp(`(${escapeRegExp(escapeHtml(query))})`, 'ig');
    return escapeHtml(text).replace(pattern, '<mark>$1</mark>');
  }

  function buildVerseCard(v, query) {
    const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
    const refBtn = $('.verse-ref', node);
    refBtn.textContent = `${v.abbr} ${v.chapter}:${v.verse}`;
    refBtn.setAttribute('aria-label', `Open ${v.book} chapter ${v.chapter}`);
    $('.verse-genre', node).textContent = v.genre;
    $('.verse-text', node).innerHTML = highlightText(v.text, query);

    refBtn.addEventListener('click', () => openChapterModal(v.book, v.chapter, v.verse));
    $('.context-btn', node).addEventListener('click', () => openChapterModal(v.book, v.chapter, v.verse));

    const listenBtn = $('.listen-btn', node);
    listenBtn.addEventListener('click', () => {
      const label = `${v.book} ${v.chapter}:${v.verse}, ${TRANSLATIONS[state.translation].label}`;
      toggleSpeak(listenBtn, () => ({ text: `${v.book} ${v.chapter}:${v.verse}. ${v.text}`, label }));
    });

    const noteBtn = $('.note-btn', node);
    const noteEl = $('.verse-note', node);
    noteBtn.addEventListener('click', () => {
      const isOpen = !noteEl.hidden;
      if (isOpen) {
        noteEl.hidden = true;
        noteBtn.classList.remove('is-active');
        return;
      }
      if (!noteEl.dataset.built) {
        noteEl.innerHTML = buildStudyNoteHtml(v, query);
        noteEl.dataset.built = '1';
        $$('.chip-rerun', noteEl).forEach(chip => {
          chip.addEventListener('click', () => {
            els.input.value = chip.dataset.term;
            runSearch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        });
      }
      noteEl.hidden = false;
      noteBtn.classList.add('is-active');
    });

    const copyBtn = $('.copy-btn', node);
    copyBtn.addEventListener('click', async () => {
      const label = `${v.book} ${v.chapter}:${v.verse}`;
      const labelEl = $('.label', copyBtn);
      const original = labelEl.textContent;
      try {
        await navigator.clipboard.writeText(`"${v.text}" — ${label} (${TRANSLATIONS[state.translation].label})`);
        labelEl.textContent = 'Copied';
      } catch {
        labelEl.textContent = 'Failed';
      }
      setTimeout(() => { labelEl.textContent = original; }, 1500);
    });

    return node;
  }

  /* ---------------- Study notes ---------------- */
  function findThemeMatch(query, verseTextLower) {
    const q = query.toLowerCase();
    if (state.themes[q]) return { key: q, ...state.themes[q] };
    for (const key of state.themeKeys) {
      if (q.includes(key) || key.includes(q)) {
        return { key, ...state.themes[key] };
      }
    }
    for (const key of state.themeKeys) {
      if (verseTextLower.includes(key)) return { key, ...state.themes[key] };
    }
    return null;
  }

  function relatedThemeChips(verseTextLower, excludeKey) {
    const found = [];
    for (const key of state.themeKeys) {
      if (key === excludeKey) continue;
      if (verseTextLower.includes(key)) found.push(key);
      if (found.length >= 4) break;
    }
    return found;
  }

  function genericNote(v) {
    const testamentName = v.testament === 'OT' ? 'Old Testament' : 'New Testament';
    return `This verse is from ${v.book}, part of the ${v.genre} section of the ${testamentName}. Reading the surrounding verses will give fuller context — try “Read chapter” below to see it alongside the rest of ${v.book} ${v.chapter}.`;
  }

  function buildStudyNoteHtml(v, query) {
    const match = findThemeMatch(query, v.textLower);
    const related = relatedThemeChips(v.textLower, match ? match.key : null);
    let html = '<h4>Study note</h4>';
    if (match) {
      html += `<p><strong>${escapeHtml(match.theme)}.</strong> ${escapeHtml(match.note)}</p>`;
    } else {
      html += `<p>${escapeHtml(genericNote(v))}</p>`;
    }
    if (related.length) {
      html += `<div class="note-crossrefs">Also appears here: ${related.map(k => `<button type="button" class="chip-rerun" data-term="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join('')}</div>`;
    }
    html += `<div class="note-crossrefs">Study notes are brief, non-denominational starting points for reflection — not official doctrine.</div>`;
    return html;
  }

  /* ---------------- Chapter modal ---------------- */
  function openChapterModal(bookName, chapter, targetVerse) {
    const chapterVerses = activeVerses().filter(v => v.book === bookName && v.chapter === chapter);
    els.modalTitle.textContent = `${bookName} ${chapter}`;
    els.modalBody.innerHTML = chapterVerses.map(v => {
      const isTarget = v.verse === targetVerse;
      return `<span class="cv${isTarget ? ' is-target' : ''}" data-verse="${v.verse}"><sup>${v.verse}</sup>${isTarget ? `<mark>${escapeHtml(v.text)}</mark>` : escapeHtml(v.text)}</span> `;
    }).join('');

    els.modal.hidden = false;
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const targetEl = $(`.cv[data-verse="${targetVerse}"]`, els.modalBody);
      if (targetEl) targetEl.scrollIntoView({ block: 'center' });
    });

    els.chapterListenBtn.onclick = () => {
      const fullText = chapterVerses.map(v => v.text).join(' ');
      toggleSpeak(els.chapterListenBtn, () => ({ text: fullText, label: `${bookName} ${chapter}, ${TRANSLATIONS[state.translation].label}` }));
    };
  }

  function closeModal() {
    els.modal.hidden = true;
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ---------------- Speech / audio ---------------- */
  let currentSpeakBtn = null;

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    return voices.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|zira/i.test(v.name))
      || voices.find(v => /^en/i.test(v.lang))
      || voices[0];
  }

  function speak(text, label) {
    if (!('speechSynthesis' in window)) {
      alert('Sorry, your browser does not support spoken audio.');
      return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = state.rate;
    const voice = pickVoice();
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      els.audioBar.hidden = false;
      els.audioBarLabel.textContent = label;
    };
    utter.onend = utter.onerror = () => {
      els.audioBar.hidden = true;
      resetSpeakButton();
    };
    speechSynthesis.speak(utter);
  }

  function setButtonLabel(btn, text) {
    const labelEl = $('.label', btn);
    if (labelEl) labelEl.textContent = text;
  }

  function resetSpeakButton() {
    if (currentSpeakBtn) {
      setButtonLabel(currentSpeakBtn, currentSpeakBtn.dataset.idleLabel || 'Listen');
      currentSpeakBtn.classList.remove('is-active');
    }
    currentSpeakBtn = null;
  }

  function toggleSpeak(btn, buildFn) {
    const isThisSpeaking = currentSpeakBtn === btn && speechSynthesis.speaking;
    if (isThisSpeaking) {
      speechSynthesis.cancel();
      els.audioBar.hidden = true;
      resetSpeakButton();
      return;
    }
    if (currentSpeakBtn) resetSpeakButton();

    const { text, label } = buildFn();
    state.lastUtteranceBuilder = buildFn;
    currentSpeakBtn = btn;
    btn.dataset.idleLabel = $('.label', btn) ? $('.label', btn).textContent : 'Listen';
    setButtonLabel(btn, 'Stop');
    btn.classList.add('is-active');
    speak(text, label);
  }

  els.audioStopBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    els.audioBar.hidden = true;
    resetSpeakButton();
  });

  els.rateSelect.addEventListener('change', () => {
    state.rate = parseFloat(els.rateSelect.value);
    if (speechSynthesis.speaking && state.lastUtteranceBuilder) {
      const { text, label } = state.lastUtteranceBuilder();
      speak(text, label);
    }
  });

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {};
  }

  /* ---------------- Theme (light/dark) ---------------- */
  function initTheme() {
    const saved = localStorage.getItem('biblebot-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    els.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme')
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('biblebot-theme', next);
    });
  }

  /* ---------------- Translation switching ---------------- */
  async function setTranslation(key) {
    if (key === state.translation) return;
    $$('.tt-btn', els.translationToggle).forEach(b => b.classList.toggle('is-active', b.dataset.translation === key));
    state.translation = key;

    if (!state.bibles[key]) {
      els.statusBar.textContent = `Loading the ${TRANSLATIONS[key].name}…`;
      try {
        await loadTranslation(key);
      } catch (err) {
        els.statusBar.textContent = `Could not load the ${TRANSLATIONS[key].name}. Please try again.`;
        console.error(err);
        return;
      }
    }
    if (state.query) {
      runSearch();
    } else {
      els.statusBar.textContent = '';
    }
  }

  function initTranslationToggle() {
    $$('.tt-btn', els.translationToggle).forEach(btn => {
      btn.addEventListener('click', () => setTranslation(btn.dataset.translation));
    });
  }

  /* ---------------- URL sync ---------------- */
  function syncUrl() {
    const url = new URL(location.href);
    if (state.query) url.searchParams.set('q', state.query); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }

  /* ---------------- Event wiring ---------------- */
  function initEvents() {
    els.form.addEventListener('submit', e => { e.preventDefault(); runSearch(); });
    els.input.addEventListener('input', debounce(runSearch, 280));
    els.clearBtn.addEventListener('click', () => { els.input.value = ''; runSearch(); els.input.focus(); });

    $$('.chip', els.filters).forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.chip', els.filters).forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        state.testament = chip.dataset.testament;
        state.book = '';
        populateBookFilter();
        runSearch();
      });
    });

    els.bookFilter.addEventListener('change', () => { state.book = els.bookFilter.value; runSearch(); });
    els.sortOrder.addEventListener('change', () => { state.sort = els.sortOrder.value; runSearch(); });

    els.loadMoreBtn.addEventListener('click', renderMore);

    $$('[data-close-modal]').forEach(el => el.addEventListener('click', () => {
      closeModal();
      speechSynthesis.cancel();
      els.audioBar.hidden = true;
      resetSpeakButton();
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !els.modal.hidden) closeModal(); });
  }

  /* ---------------- Init ---------------- */
  async function init() {
    initTheme();
    renderQuickTags();
    initEvents();
    initTranslationToggle();
    els.statusBar.textContent = 'Loading the Bible…';
    try {
      await loadCoreData();
      await loadTranslation('kjv');
    } catch (err) {
      els.statusBar.textContent = 'Could not load Bible data. Please refresh the page.';
      console.error(err);
      return;
    }
    els.statusBar.textContent = '';

    // Warm the second translation in the background so switching feels instant.
    Object.keys(TRANSLATIONS).forEach(key => {
      if (key !== state.translation) loadTranslation(key).catch(() => {});
    });

    const params = new URL(location.href).searchParams;
    const initialQ = params.get('q');
    if (initialQ) {
      els.input.value = initialQ;
      runSearch();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

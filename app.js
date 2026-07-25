(() => {
  'use strict';

  /* ---------------- Translations ---------------- */
  const TRANSLATIONS = {
    kjv: { label: 'KJV', name: 'King James Version', file: 'data/bible-kjv.json' },
    web: { label: 'WEB', name: 'World English Bible', file: 'data/bible-web.json' },
    bsb: { label: 'BSB', name: 'Berean Standard Bible', file: 'data/bible-bsb.json' },
  };

  /* ---------------- State ---------------- */
  const state = {
    booksMeta: [],
    booksByName: new Map(),
    themes: {},
    themeKeys: [],
    comfortTopics: [],
    growthThemes: [],
    geoRegions: [],
    timelineEras: [],
    fontScale: 1,
    bookAliases: new Map(),
    translation: 'kjv',
    bibles: {},
    bibleRaw: {},
    query: '',
    testament: 'ALL',
    book: '',
    sort: 'canon',
    results: [],
    shown: 0,
    pageSize: 25,
    rate: 1,
    lastUtteranceBuilder: null,
    currentPlan: null,
    currentPlanDates: null,
    view: 'search',
  };

  const QUICK_TAGS = ['love', 'faith', 'hope', 'peace', 'grace', 'forgiveness', 'fear not', 'wisdom', 'joy', 'strength', 'prayer', 'salvation'];
  const GOAL_QUICK_TAGS = ['Peace over anxiety', 'Grow my faith', 'A deeper prayer life', 'Practice gratitude', 'Forgive someone', 'Be more patient', 'Find my purpose', 'Build a habit', 'Love people better', 'Hope in a hard season'];

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
    comfortPanel: $('#comfortPanel'),
    comfortLabel: $('#comfortLabel'),
    comfortIntro: $('#comfortIntro'),
    comfortVerses: $('#comfortVerses'),
    navTabs: $$('.nav-tab'),
    searchView: $('#searchView'),
    plannerView: $('#plannerView'),
    plannerModeToggle: $('#plannerModeToggle'),
    goalForm: $('#goalForm'),
    goalInput: $('#goalInput'),
    goalQuickTags: $('#goalQuickTags'),
    sermonForm: $('#sermonForm'),
    sermonTopicInput: $('#sermonTopicInput'),
    sermonVersesInput: $('#sermonVersesInput'),
    sermonKeywordsInput: $('#sermonKeywordsInput'),
    planEmptyState: $('#planEmptyState'),
    planRoot: $('#planRoot'),
    geoView: $('#geoView'),
    geoBreadcrumb: $('#geoBreadcrumb'),
    geoMap: $('#geoMap'),
    geoMapPanel: $('#geoMapPanel'),
    geoRegionPanel: $('#geoRegionPanel'),
    geoLocationPanel: $('#geoLocationPanel'),
    timelineView: $('#timelineView'),
    timelineBreadcrumb: $('#timelineBreadcrumb'),
    timelineRail: $('#timelineRail'),
    timelineListPanel: $('#timelineListPanel'),
    timelineEraPanel: $('#timelineEraPanel'),
    timelineEventPanel: $('#timelineEventPanel'),
    fontSmallerBtn: $('#fontSmallerBtn'),
    fontLargerBtn: $('#fontLargerBtn'),
    footerShareBtn: $('#footerShareBtn'),
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
  function squash(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  /* ---------------- Data loading ---------------- */
  function flattenBible(bookObjs) {
    const flat = [];
    bookObjs.forEach((bookObj) => {
      const bmeta = state.booksByName.get(bookObj.b) || {};
      bookObj.c.forEach((versesArr, chIdx) => {
        const chapterNum = chIdx + 1;
        versesArr.forEach((text, vIdx) => {
          if (!text) return;
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
    const [metaRes, themesRes, comfortRes, growthRes, geoRes, timelineRes] = await Promise.all([
      fetch('data/books-meta.json'),
      fetch('data/study-themes.json'),
      fetch('data/comfort-topics.json'),
      fetch('data/growth-themes.json'),
      fetch('data/geo-regions.json'),
      fetch('data/timeline-eras.json'),
    ]);
    const [meta, themes, comfort, growth, geo, timeline] = await Promise.all([
      metaRes.json(), themesRes.json(), comfortRes.json(), growthRes.json(), geoRes.json(), timelineRes.json(),
    ]);
    state.booksMeta = meta;
    meta.forEach(m => state.booksByName.set(m.name, m));
    state.themes = themes;
    state.themeKeys = Object.keys(themes).sort((a, b) => b.length - a.length);
    state.comfortTopics = comfort;
    state.growthThemes = growth;
    state.geoRegions = geo;
    state.timelineEras = timeline;
    buildBookAliases();
    populateBookFilter();
  }

  function buildBookAliases() {
    const extra = {
      psalm: 'Psalms', proverb: 'Proverbs', revelations: 'Revelation',
      songofsongs: 'Song of Solomon', canticles: 'Song of Solomon', song: 'Song of Solomon',
    };
    Object.entries(extra).forEach(([k, v]) => state.bookAliases.set(k, v));
    state.booksMeta.forEach(b => {
      state.bookAliases.set(squash(b.name), b.name);
      state.bookAliases.set(squash(b.abbr), b.name);
    });
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

  function renderGoalQuickTags() {
    GOAL_QUICK_TAGS.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-btn';
      btn.textContent = tag;
      btn.addEventListener('click', () => {
        els.goalInput.value = tag;
        buildAndRenderGoalPlan(tag);
      });
      els.goalQuickTags.appendChild(btn);
    });
  }

  /* ---------------- Verse reference resolution ---------------- */
  function resolveVerseRef(ref) {
    const raw = state.bibleRaw[state.translation];
    if (!raw) return null;
    const bookObj = raw.find(b => b.b === ref.book);
    if (!bookObj) return null;
    const chapterVerses = bookObj.c[ref.chapter - 1] || [];
    const vEnd = ref.verseEnd || ref.verse;
    const parts = [];
    for (let v = ref.verse; v <= vEnd; v++) {
      const t = chapterVerses[v - 1];
      if (t) parts.push(t);
    }
    if (!parts.length) return null;
    const text = parts.join(' ');
    const bmeta = state.booksByName.get(ref.book) || {};
    return {
      book: ref.book, abbr: bmeta.abbr || ref.book, testament: bmeta.testament || 'OT', genre: bmeta.genre || '',
      chapter: ref.chapter, verse: ref.verse, verseEnd: vEnd, text, textLower: text.toLowerCase(),
    };
  }

  function refLabel(ref) {
    const bmeta = state.booksByName.get(ref.book) || {};
    const abbr = bmeta.abbr || ref.book;
    const vEnd = ref.verseEnd || ref.verse;
    return `${abbr} ${ref.chapter}:${ref.verse}${vEnd !== ref.verse ? '-' + vEnd : ''}`;
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

  function findComfortTopic(query) {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    for (const topic of state.comfortTopics) {
      for (const kw of topic.keywords) {
        if (q === kw) return topic;
        if (kw.includes(' ') && q.includes(kw)) return topic;
      }
    }
    return null;
  }

  function updateComfortPanel(query) {
    const topic = findComfortTopic(query);
    if (!topic) {
      els.comfortPanel.hidden = true;
      els.comfortVerses.innerHTML = '';
      return;
    }
    els.comfortLabel.textContent = `You searched “${query}” — here's some comfort`;
    els.comfortIntro.textContent = topic.intro;
    els.comfortVerses.innerHTML = '';
    topic.verses.forEach(ref => {
      const v = resolveVerseRef(ref);
      if (!v) return;
      const node = buildVerseCard(v, topic.label.toLowerCase());
      els.comfortVerses.appendChild(node);
    });
    els.comfortPanel.hidden = false;
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
      els.comfortPanel.hidden = true;
      return;
    }

    updateComfortPanel(q);
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
    if (!query) return escapeHtml(text);
    const pattern = new RegExp(`(${escapeRegExp(escapeHtml(query))})`, 'ig');
    return escapeHtml(text).replace(pattern, '<mark>$1</mark>');
  }

  function buildVerseCard(v, query) {
    const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
    const refBtn = $('.verse-ref', node);
    const vEnd = v.verseEnd || v.verse;
    refBtn.textContent = `${v.abbr} ${v.chapter}:${v.verse}${vEnd !== v.verse ? '-' + vEnd : ''}`;
    refBtn.setAttribute('aria-label', `Open ${v.book} chapter ${v.chapter}`);
    $('.verse-genre', node).textContent = v.genre;
    $('.verse-text', node).innerHTML = highlightText(v.text, query);

    refBtn.addEventListener('click', () => openChapterModal(v.book, v.chapter, v.verse, vEnd));
    $('.context-btn', node).addEventListener('click', () => openChapterModal(v.book, v.chapter, v.verse, vEnd));

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
      const label = `${v.book} ${v.chapter}:${v.verse}${vEnd !== v.verse ? '-' + vEnd : ''}`;
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

    const shareImgBtn = $('.share-img-btn', node);
    shareImgBtn.addEventListener('click', () => {
      const label = `${v.book} ${v.chapter}:${v.verse}${vEnd !== v.verse ? '-' + vEnd : ''} (${TRANSLATIONS[state.translation].label})`;
      shareVerseAsImage(label, v.text, v.book, shareImgBtn);
    });

    return node;
  }

  /* ---------------- Study notes ---------------- */
  function findThemeMatch(query, verseTextLower) {
    const q = query.toLowerCase();
    if (state.themes[q]) return { key: q, ...state.themes[q] };
    for (const key of state.themeKeys) {
      if (q && (q.includes(key) || key.includes(q))) {
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
  function openChapterModal(bookName, chapter, targetVerse, targetVerseEnd) {
    const chapterVerses = activeVerses().filter(v => v.book === bookName && v.chapter === chapter);
    const vEnd = targetVerseEnd || targetVerse;
    els.modalTitle.textContent = `${bookName} ${chapter}`;
    els.modalBody.innerHTML = chapterVerses.map(v => {
      const isTarget = v.verse >= targetVerse && v.verse <= vEnd;
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
    if (state.currentPlan) {
      renderPlan(state.currentPlan, state.currentPlanDates);
    }
  }

  function initTranslationToggle() {
    $$('.tt-btn', els.translationToggle).forEach(btn => {
      btn.addEventListener('click', () => setTranslation(btn.dataset.translation));
    });
  }

  /* =========================================================
     Weekly Planner + Pastor Planner
     ========================================================= */

  function getMonday(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }
  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }
  function sameYMD(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function getWeekDates() {
    const monday = getMonday(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }
  function formatDayLabel(d) {
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function formatWeekRange(monday) {
    const sunday = addDays(monday, 6);
    const startOpts = { month: 'short', day: 'numeric' };
    const endOpts = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${monday.toLocaleDateString(undefined, startOpts)} – ${sunday.toLocaleDateString(undefined, endOpts)}`;
  }

  function matchTheme(text) {
    const q = (text || '').toLowerCase();
    let best = null, bestScore = 0;
    for (const theme of state.growthThemes) {
      if (!theme.keywords || !theme.keywords.length) continue;
      let score = 0;
      for (const kw of theme.keywords) {
        if (q.includes(kw)) score += kw.length;
      }
      if (score > bestScore) { bestScore = score; best = theme; }
    }
    return best || state.growthThemes.find(t => t.id === 'general');
  }

  function cloneDays(theme) {
    return theme.days.map(d => ({ ...d }));
  }

  function buildPlanFromGoal(goalText) {
    const theme = matchTheme(goalText);
    const goal = goalText.trim();
    return {
      mode: 'goal',
      themeId: theme.id,
      sourceKey: goal.toLowerCase(),
      sourceLabel: goal ? `Your goal: “${goal}”` : 'A week of growth',
      title: theme.title,
      intro: theme.weekIntro + (goal ? ` This week is shaped around your goal to ${goal.replace(/\.$/, '')}.` : ''),
      memoryVerse: theme.memoryVerse,
      days: cloneDays(theme),
    };
  }

  function parseVerseRefs(text) {
    if (!text) return [];
    const chunks = text.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    const refs = [];
    for (const chunkRaw of chunks) {
      let chunk = chunkRaw.replace(/^(1st|first)\b/i, '1').replace(/^(2nd|second)\b/i, '2').replace(/^(3rd|third)\b/i, '3');
      const m = chunk.match(/^([1-3]?\s*[A-Za-z][A-Za-z\s]*?)\.?\s+(\d{1,3})(?:\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?\.?$/);
      if (!m) continue;
      const canonical = state.bookAliases.get(squash(m[1]));
      if (!canonical) continue;
      const chapter = parseInt(m[2], 10);
      const raw = state.bibleRaw[state.translation];
      const bookObj = raw && raw.find(b => b.b === canonical);
      if (!bookObj || chapter < 1 || chapter > bookObj.c.length) continue;
      const chapterLen = bookObj.c[chapter - 1].length;
      let vStart = m[3] ? parseInt(m[3], 10) : 1;
      let vEnd = m[4] ? parseInt(m[4], 10) : (m[3] ? vStart : Math.min(chapterLen, 8));
      vStart = Math.max(1, Math.min(vStart, chapterLen));
      vEnd = Math.max(vStart, Math.min(vEnd, chapterLen));
      refs.push({ book: canonical, chapter, verse: vStart, verseEnd: vEnd });
      if (refs.length >= 7) break;
    }
    return refs;
  }

  function buildPlanFromSermon(topic, versesText, keywordsText) {
    const parsedVerses = parseVerseRefs(versesText);
    const combined = `${topic || ''} ${keywordsText || ''}`;
    const theme = matchTheme(combined);
    const days = cloneDays(theme);
    const usedCount = Math.min(parsedVerses.length, days.length);
    for (let i = 0; i < usedCount; i++) {
      const ref = parsedVerses[i];
      days[i] = {
        ...days[i],
        book: ref.book, chapter: ref.chapter, verse: ref.verse, verseEnd: ref.verseEnd,
        focus: i === 0 ? 'From Sunday’s message' : days[i].focus,
        reflection: i === 0
          ? 'This is one of the verses your pastor centered the message on — sit with it again today, away from the sermon setting.'
          : `${days[i].reflection} (A verse your pastor also referenced.)`,
        fromSermon: true,
      };
    }
    const topicClean = (topic || '').trim();
    const memoryVerse = parsedVerses[0] || theme.memoryVerse;
    return {
      mode: 'sermon',
      themeId: theme.id,
      sourceKey: `${topicClean.toLowerCase()}|${(versesText || '').toLowerCase()}|${(keywordsText || '').toLowerCase()}`,
      sourceLabel: topicClean ? `From Sunday’s message: “${topicClean}”` : 'From Sunday’s message',
      title: theme.title,
      intro: (topicClean
        ? `Building on what your pastor preached about “${topicClean}”, this week turns it into daily practice. `
        : 'This week turns Sunday’s message into daily practice. ') + theme.weekIntro,
      memoryVerse,
      days,
    };
  }

  /* ---------------- Plan progress persistence ---------------- */
  function planStorageKey(plan) {
    return `biblebot-plan-progress-${hashStr(plan.mode + '|' + plan.themeId + '|' + plan.sourceKey)}`;
  }
  function loadPlanProgress(plan) {
    try {
      const raw = localStorage.getItem(planStorageKey(plan));
      if (raw) return JSON.parse(raw);
    } catch {}
    return new Array(plan.days.length).fill(false);
  }
  function savePlanProgress(plan, progress) {
    try { localStorage.setItem(planStorageKey(plan), JSON.stringify(progress)); } catch {}
  }

  /* ---------------- Plan rendering ---------------- */
  function renderPlan(plan, weekDates) {
    weekDates = weekDates || getWeekDates();
    state.currentPlan = plan;
    state.currentPlanDates = weekDates;
    const today = new Date();
    const progress = loadPlanProgress(plan);

    els.planEmptyState.hidden = true;
    els.planRoot.hidden = false;

    const mv = resolveVerseRef(plan.memoryVerse);
    const doneCount = progress.filter(Boolean).length;
    const pct = Math.round((doneCount / plan.days.length) * 100);

    const daysHtml = plan.days.map((day, i) => {
      const d = weekDates[i];
      const isToday = sameYMD(d, today);
      const isPast = d < today && !isToday;
      const isDone = !!progress[i];
      const v = resolveVerseRef(day);
      return `
        <li class="plan-day${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}${isDone ? ' is-done' : ''}" data-day-index="${i}">
          <button class="plan-day-head" type="button" aria-expanded="${isToday}">
            <span class="plan-day-date">${escapeHtml(formatDayLabel(d))}</span>
            <span class="plan-day-focus">${escapeHtml(day.focus)}</span>
            ${isToday ? '<span class="today-badge">Today</span>' : ''}
            ${day.fromSermon ? '<span class="sermon-badge">From the sermon</span>' : ''}
            <svg class="plan-chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
          </button>
          <div class="plan-day-body"${isToday ? '' : ' hidden'}>
            <p class="plan-day-ref">${escapeHtml(refLabel(day))}</p>
            <p class="plan-day-verse">${v ? escapeHtml(v.text) : ''}</p>
            <button class="action-btn plan-day-listen" type="button">
              <svg class="action-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3Zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Z"/></svg>
              <span class="label">Listen</span>
            </button>
            <p class="plan-day-reflection">${escapeHtml(day.reflection)}</p>
            <p class="plan-day-prayer"><strong>Prayer:</strong> ${escapeHtml(day.prayer)}</p>
            <label class="plan-day-action">
              <input type="checkbox" class="plan-day-checkbox" data-day-index="${i}" ${isDone ? 'checked' : ''} />
              <span><strong>Try today:</strong> ${escapeHtml(day.action)}</span>
            </label>
          </div>
        </li>`;
    }).join('');

    els.planRoot.innerHTML = `
      <div class="plan-card" id="printArea">
        <div class="plan-card-head">
          <p class="plan-source">${escapeHtml(plan.sourceLabel)}</p>
          <h2 class="plan-title">${escapeHtml(plan.title)}</h2>
          <p class="plan-range">${escapeHtml(formatWeekRange(weekDates[0]))}</p>
        </div>
        <p class="plan-intro">${escapeHtml(plan.intro)}</p>
        <div class="memory-verse-box">
          <p class="mv-label">Memory verse for the week</p>
          <p class="mv-ref">${escapeHtml(refLabel(plan.memoryVerse))}</p>
          <p class="mv-text">${mv ? escapeHtml(mv.text) : ''}</p>
          <button class="action-btn mv-listen-btn" type="button">
            <svg class="action-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3Zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Z"/></svg>
            <span class="label">Listen</span>
          </button>
          <button class="action-btn mv-share-btn" type="button">
            <svg class="action-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M18 16.08a2.9 2.9 0 0 0-1.94.75l-7.05-4.11a2.9 2.9 0 0 0 0-1.44l6.97-4.06A3 3 0 1 0 15 5.5a3 3 0 0 0 .05.53l-6.97 4.06a3 3 0 1 0 0 3.82l7.05 4.11a2.9 2.9 0 1 0 2.87-2.94Z"/></svg>
            <span class="label">Share</span>
          </button>
        </div>
        <div class="plan-progress">
          <div class="plan-progress-bar"><div class="plan-progress-fill" style="width:${pct}%"></div></div>
          <span class="plan-progress-label" id="planProgressLabel">${doneCount}/${plan.days.length} days complete</span>
        </div>
        <div class="plan-toolbar">
          <button id="planCopyBtn" class="btn-small" type="button">Copy as text</button>
          <button id="planPrintBtn" class="btn-small" type="button">Print / Save PDF</button>
          <button id="planShareBtn" class="btn-small" type="button">Copy shareable link</button>
          <button id="planResetBtn" class="btn-small" type="button">Start over</button>
        </div>
        <ol class="plan-days">${daysHtml}</ol>
      </div>`;

    wirePlanEvents(plan, weekDates, progress);
  }

  function wirePlanEvents(plan, weekDates, progress) {
    $$('.plan-day-head', els.planRoot).forEach(head => {
      head.addEventListener('click', () => {
        const body = head.nextElementSibling;
        const expanded = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!expanded));
        body.hidden = expanded;
      });
    });

    $$('.plan-day-listen', els.planRoot).forEach(btn => {
      const li = btn.closest('.plan-day');
      const i = parseInt(li.dataset.dayIndex, 10);
      const day = plan.days[i];
      btn.addEventListener('click', () => {
        const v = resolveVerseRef(day);
        if (!v) return;
        toggleSpeak(btn, () => ({ text: `${refLabel(day)}. ${v.text}`, label: `${refLabel(day)}, ${TRANSLATIONS[state.translation].label}` }));
      });
    });

    const mvShareBtn = $('.mv-share-btn', els.planRoot);
    if (mvShareBtn) {
      mvShareBtn.addEventListener('click', () => {
        const mv = resolveVerseRef(plan.memoryVerse);
        if (!mv) return;
        shareVerseAsImage(refLabel(plan.memoryVerse), mv.text, plan.title, mvShareBtn);
      });
    }

    const mvListenBtn = $('.mv-listen-btn', els.planRoot);
    if (mvListenBtn) {
      mvListenBtn.addEventListener('click', () => {
        const mv = resolveVerseRef(plan.memoryVerse);
        if (!mv) return;
        toggleSpeak(mvListenBtn, () => ({ text: `${refLabel(plan.memoryVerse)}. ${mv.text}`, label: `Memory verse, ${refLabel(plan.memoryVerse)}` }));
      });
    }

    $$('.plan-day-checkbox', els.planRoot).forEach(cb => {
      cb.addEventListener('change', () => {
        const i = parseInt(cb.dataset.dayIndex, 10);
        progress[i] = cb.checked;
        savePlanProgress(plan, progress);
        cb.closest('.plan-day').classList.toggle('is-done', cb.checked);
        const doneCount = progress.filter(Boolean).length;
        const pct = Math.round((doneCount / plan.days.length) * 100);
        $('.plan-progress-fill', els.planRoot).style.width = pct + '%';
        $('#planProgressLabel', els.planRoot).textContent = `${doneCount}/${plan.days.length} days complete`;
      });
    });

    $('#planCopyBtn', els.planRoot).addEventListener('click', async (e) => {
      const text = planToText(plan, weekDates);
      const btn = e.currentTarget;
      const original = btn.textContent;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied!';
      } catch {
        btn.textContent = 'Copy failed';
      }
      setTimeout(() => { btn.textContent = original; }, 1500);
    });

    $('#planPrintBtn', els.planRoot).addEventListener('click', () => window.print());

    $('#planShareBtn', els.planRoot).addEventListener('click', async (e) => {
      const url = buildShareUrl(plan);
      const btn = e.currentTarget;
      const original = btn.textContent;
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = 'Link copied!';
      } catch {
        btn.textContent = 'Copy failed';
      }
      setTimeout(() => { btn.textContent = original; }, 1500);
    });

    $('#planResetBtn', els.planRoot).addEventListener('click', () => {
      state.currentPlan = null;
      state.currentPlanDates = null;
      els.planRoot.hidden = true;
      els.planRoot.innerHTML = '';
      els.planEmptyState.hidden = false;
      els.goalInput.value = '';
      els.sermonTopicInput.value = '';
      els.sermonVersesInput.value = '';
      els.sermonKeywordsInput.value = '';
      history.replaceState(null, '', location.pathname + location.search);
    });
  }

  function planToText(plan, weekDates) {
    const lines = [];
    lines.push(plan.title);
    lines.push(plan.sourceLabel);
    lines.push(formatWeekRange(weekDates[0]));
    lines.push('');
    lines.push(plan.intro);
    lines.push('');
    const mv = resolveVerseRef(plan.memoryVerse);
    lines.push(`MEMORY VERSE — ${refLabel(plan.memoryVerse)}`);
    if (mv) lines.push(mv.text);
    lines.push('');
    plan.days.forEach((day, i) => {
      const v = resolveVerseRef(day);
      lines.push(`${formatDayLabel(weekDates[i])} — ${day.focus}`);
      lines.push(refLabel(day));
      if (v) lines.push(v.text);
      lines.push(`Reflection: ${day.reflection}`);
      lines.push(`Prayer: ${day.prayer}`);
      lines.push(`Try today: ${day.action}`);
      lines.push('');
    });
    lines.push(`— Built with Bible Bot (${TRANSLATIONS[state.translation].label})`);
    return lines.join('\n');
  }

  /* ---------------- Shareable links ---------------- */
  function toBase64Url(obj) {
    const json = JSON.stringify(obj);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromBase64Url(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  }

  function buildShareUrl(plan) {
    const seed = plan.mode === 'goal'
      ? { m: 'g', g: els.goalInput.value || plan.sourceKey }
      : { m: 's', t: els.sermonTopicInput.value, v: els.sermonVersesInput.value, k: els.sermonKeywordsInput.value };
    return `${location.origin}${location.pathname}#plan=${toBase64Url(seed)}`;
  }

  function buildAndRenderGoalPlan(goalText) {
    if (!goalText || !goalText.trim()) return;
    const plan = buildPlanFromGoal(goalText);
    renderPlan(plan);
    window.scrollTo({ top: els.planRoot.offsetTop - 90, behavior: 'smooth' });
  }
  function buildAndRenderSermonPlan(topic, verses, keywords) {
    if (!topic.trim() && !verses.trim() && !keywords.trim()) return;
    const plan = buildPlanFromSermon(topic, verses, keywords);
    renderPlan(plan);
    window.scrollTo({ top: els.planRoot.offsetTop - 90, behavior: 'smooth' });
  }

  function tryLoadSharedPlan() {
    const hash = location.hash;
    if (!hash.startsWith('#plan=')) return false;
    try {
      const seed = fromBase64Url(hash.slice('#plan='.length));
      switchView('planner');
      if (seed.m === 'g') {
        setPlannerMode('goal');
        els.goalInput.value = seed.g || '';
        buildAndRenderGoalPlan(seed.g || '');
      } else if (seed.m === 's') {
        setPlannerMode('sermon');
        els.sermonTopicInput.value = seed.t || '';
        els.sermonVersesInput.value = seed.v || '';
        els.sermonKeywordsInput.value = seed.k || '';
        buildAndRenderSermonPlan(seed.t || '', seed.v || '', seed.k || '');
      }
      return true;
    } catch (err) {
      console.error('Could not load shared plan', err);
      return false;
    }
  }

  /* ---------------- Planner form wiring ---------------- */
  function setPlannerMode(mode) {
    $$('.tt-btn', els.plannerModeToggle).forEach(b => b.classList.toggle('is-active', b.dataset.mode === mode));
    els.goalForm.hidden = mode !== 'goal';
    els.sermonForm.hidden = mode !== 'sermon';
  }

  function initPlanner() {
    renderGoalQuickTags();
    $$('.tt-btn', els.plannerModeToggle).forEach(btn => {
      btn.addEventListener('click', () => setPlannerMode(btn.dataset.mode));
    });
    els.goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      buildAndRenderGoalPlan(els.goalInput.value);
    });
    els.sermonForm.addEventListener('submit', (e) => {
      e.preventDefault();
      buildAndRenderSermonPlan(els.sermonTopicInput.value, els.sermonVersesInput.value, els.sermonKeywordsInput.value);
    });
  }

  /* =========================================================
     Bible Geolocator
     ========================================================= */
  const SEA_SHAPE = 'M0,120 C120,90 180,150 260,120 C320,98 340,140 380,150 C300,220 200,260 60,260 C20,220 0,170 0,120 Z';
  const NILE_PATH = 'M270,540 C280,470 300,420 320,380 C335,352 320,320 300,290';
  const EUPHRATES_PATH = 'M600,150 C640,220 660,280 680,340 C695,382 720,420 760,450';

  function renderGeoMap() {
    const svgNS = 'http://www.w3.org/2000/svg';
    els.geoMap.innerHTML = '';

    const sea = document.createElementNS(svgNS, 'path');
    sea.setAttribute('d', SEA_SHAPE);
    sea.setAttribute('class', 'geo-sea');
    els.geoMap.appendChild(sea);

    [NILE_PATH, EUPHRATES_PATH].forEach(d => {
      const river = document.createElementNS(svgNS, 'path');
      river.setAttribute('d', d);
      river.setAttribute('class', 'geo-river');
      els.geoMap.appendChild(river);
    });

    state.geoRegions.forEach(region => {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'geo-region');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${region.name} — ${region.subtitle}`);

      const ellipse = document.createElementNS(svgNS, 'ellipse');
      ellipse.setAttribute('cx', region.cx);
      ellipse.setAttribute('cy', region.cy);
      ellipse.setAttribute('rx', region.rx);
      ellipse.setAttribute('ry', region.ry);
      g.appendChild(ellipse);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', region.cx);
      label.setAttribute('y', region.cy - 4);
      label.setAttribute('class', 'geo-region-label');
      label.textContent = region.name;
      g.appendChild(label);

      const sub = document.createElementNS(svgNS, 'text');
      sub.setAttribute('x', region.cx);
      sub.setAttribute('y', region.cy + 16);
      sub.setAttribute('class', 'geo-region-sublabel');
      sub.textContent = region.subtitle;
      g.appendChild(sub);

      const activate = () => selectGeoRegion(region.id);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });

      els.geoMap.appendChild(g);
    });
  }

  function setGeoBreadcrumb(crumbs) {
    els.geoBreadcrumb.innerHTML = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      return `<button type="button" class="geo-crumb${isLast ? ' is-active' : ''}" data-level="${c.level}">${escapeHtml(c.label)}</button>`;
    }).join('<span class="geo-crumb-sep">›</span>');
    $$('.geo-crumb', els.geoBreadcrumb).forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const c = crumbs[i];
        if (c.level === 'map') showGeoMap();
        else if (c.level === 'region') selectGeoRegion(c.id);
      });
    });
  }

  function showGeoMap() {
    els.geoMapPanel.hidden = false;
    els.geoRegionPanel.hidden = true;
    els.geoLocationPanel.hidden = true;
    setGeoBreadcrumb([{ level: 'map', label: 'Map' }]);
  }

  function selectGeoRegion(regionId) {
    const region = state.geoRegions.find(r => r.id === regionId);
    if (!region) return;
    els.geoMapPanel.hidden = true;
    els.geoLocationPanel.hidden = true;
    els.geoRegionPanel.hidden = false;
    setGeoBreadcrumb([{ level: 'map', label: 'Map' }, { level: 'region', id: region.id, label: region.name }]);

    els.geoRegionPanel.innerHTML = `
      <h2 class="geo-region-title">${escapeHtml(region.name)}</h2>
      <p class="geo-region-blurb">${escapeHtml(region.blurb)}</p>
      <div class="geo-location-grid">
        ${region.locations.map(loc => `
          <button type="button" class="geo-location-card" data-location="${escapeHtml(loc.id)}">
            <span class="geo-location-name">${escapeHtml(loc.name)}</span>
            <span class="geo-location-blurb">${escapeHtml(loc.blurb)}</span>
          </button>
        `).join('')}
      </div>`;

    $$('.geo-location-card', els.geoRegionPanel).forEach(card => {
      card.addEventListener('click', () => selectGeoLocation(region.id, card.dataset.location));
    });
  }

  function selectGeoLocation(regionId, locationId) {
    const region = state.geoRegions.find(r => r.id === regionId);
    if (!region) return;
    const loc = region.locations.find(l => l.id === locationId);
    if (!loc) return;
    els.geoMapPanel.hidden = true;
    els.geoRegionPanel.hidden = true;
    els.geoLocationPanel.hidden = false;
    setGeoBreadcrumb([
      { level: 'map', label: 'Map' },
      { level: 'region', id: region.id, label: region.name },
      { level: 'location', label: loc.name },
    ]);

    els.geoLocationPanel.innerHTML = `
      <h2 class="geo-region-title">${escapeHtml(loc.name)}</h2>
      <p class="geo-region-blurb">${escapeHtml(loc.blurb)}</p>
      <ol class="results-list" id="geoVerseList"></ol>`;

    const list = $('#geoVerseList', els.geoLocationPanel);
    loc.verses.forEach(ref => {
      const v = resolveVerseRef(ref);
      if (!v) return;
      list.appendChild(buildVerseCard(v, ''));
    });
  }

  function initGeo() {
    renderGeoMap();
    showGeoMap();
  }

  /* =========================================================
     History Timeline
     ========================================================= */
  function renderTimelineList() {
    els.timelineRail.innerHTML = state.timelineEras.map(era => `
      <li class="timeline-era" data-era="${escapeHtml(era.id)}">
        <span class="timeline-dot" aria-hidden="true"></span>
        <button type="button" class="timeline-era-btn">
          <span class="timeline-era-year">${escapeHtml(era.yearLabel)}</span>
          <span class="timeline-era-label">${escapeHtml(era.label)}</span>
          <span class="timeline-era-civ">${escapeHtml(era.civContext)}</span>
        </button>
      </li>`).join('');

    $$('.timeline-era-btn', els.timelineRail).forEach((btn, i) => {
      btn.addEventListener('click', () => selectEra(state.timelineEras[i].id));
    });
  }

  function setTimelineBreadcrumb(crumbs) {
    els.timelineBreadcrumb.innerHTML = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      return `<button type="button" class="geo-crumb${isLast ? ' is-active' : ''}" data-level="${c.level}">${escapeHtml(c.label)}</button>`;
    }).join('<span class="geo-crumb-sep">›</span>');
    $$('.geo-crumb', els.timelineBreadcrumb).forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const c = crumbs[i];
        if (c.level === 'list') showTimelineList();
        else if (c.level === 'era') selectEra(c.id);
      });
    });
  }

  function showTimelineList() {
    els.timelineListPanel.hidden = false;
    els.timelineEraPanel.hidden = true;
    els.timelineEventPanel.hidden = true;
    setTimelineBreadcrumb([{ level: 'list', label: 'Timeline' }]);
  }

  function selectEra(eraId) {
    const era = state.timelineEras.find(e => e.id === eraId);
    if (!era) return;
    els.timelineListPanel.hidden = true;
    els.timelineEventPanel.hidden = true;
    els.timelineEraPanel.hidden = false;
    setTimelineBreadcrumb([{ level: 'list', label: 'Timeline' }, { level: 'era', id: era.id, label: era.label }]);

    els.timelineEraPanel.innerHTML = `
      <p class="geo-region-year">${escapeHtml(era.yearLabel)}</p>
      <h2 class="geo-region-title">${escapeHtml(era.label)}</h2>
      <p class="geo-region-civ">${escapeHtml(era.civContext)}</p>
      <p class="geo-region-blurb">${escapeHtml(era.blurb)}</p>
      <div class="geo-location-grid">
        ${era.events.map(ev => `
          <button type="button" class="geo-location-card" data-event="${escapeHtml(ev.id)}">
            <span class="timeline-event-year">${escapeHtml(ev.yearLabel)}</span>
            <span class="geo-location-name">${escapeHtml(ev.name)}</span>
            <span class="geo-location-blurb">${escapeHtml(ev.blurb)}</span>
          </button>
        `).join('')}
      </div>`;

    $$('.geo-location-card', els.timelineEraPanel).forEach(card => {
      card.addEventListener('click', () => selectTimelineEvent(era.id, card.dataset.event));
    });
  }

  function selectTimelineEvent(eraId, eventId) {
    const era = state.timelineEras.find(e => e.id === eraId);
    if (!era) return;
    const ev = era.events.find(e => e.id === eventId);
    if (!ev) return;
    els.timelineListPanel.hidden = true;
    els.timelineEraPanel.hidden = true;
    els.timelineEventPanel.hidden = false;
    setTimelineBreadcrumb([
      { level: 'list', label: 'Timeline' },
      { level: 'era', id: era.id, label: era.label },
      { level: 'event', label: ev.name },
    ]);

    els.timelineEventPanel.innerHTML = `
      <p class="geo-region-year">${escapeHtml(ev.yearLabel)}</p>
      <h2 class="geo-region-title">${escapeHtml(ev.name)}</h2>
      <p class="geo-region-blurb">${escapeHtml(ev.blurb)}</p>
      <ol class="results-list" id="timelineVerseList"></ol>`;

    const list = $('#timelineVerseList', els.timelineEventPanel);
    ev.verses.forEach(ref => {
      const v = resolveVerseRef(ref);
      if (!v) return;
      list.appendChild(buildVerseCard(v, ''));
    });
  }

  function initTimeline() {
    renderTimelineList();
    showTimelineList();
  }

  /* ---------------- Font size control ---------------- */
  function applyFontScale() {
    document.documentElement.style.setProperty('--font-scale', state.fontScale);
  }
  function initFontSize() {
    const saved = parseFloat(localStorage.getItem('biblebot-font-scale'));
    if (!isNaN(saved)) state.fontScale = saved;
    applyFontScale();
    els.fontSmallerBtn.addEventListener('click', () => {
      state.fontScale = Math.max(0.85, Math.round((state.fontScale - 0.1) * 10) / 10);
      applyFontScale();
      localStorage.setItem('biblebot-font-scale', state.fontScale);
    });
    els.fontLargerBtn.addEventListener('click', () => {
      state.fontScale = Math.min(1.4, Math.round((state.fontScale + 0.1) * 10) / 10);
      applyFontScale();
      localStorage.setItem('biblebot-font-scale', state.fontScale);
    });
  }

  /* ---------------- Shareable verse images ---------------- */
  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line.trim()); line = w + ' '; }
      else line = test;
    }
    lines.push(line.trim());
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
    return lines.length;
  }

  async function generateVerseImage(refText, verseText, kicker) {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
    const size = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#14151f');
    grad.addColorStop(1, '#1f2233');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(205,164,94,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, size - 100, size - 100);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#5fd0c4';
    ctx.font = '700 26px "Space Grotesk", sans-serif';
    ctx.fillText(kicker.toUpperCase(), size / 2, 160);

    ctx.fillStyle = '#ece7d9';
    ctx.font = 'italic 500 46px "Fraunces", Georgia, serif';
    const quote = verseText.length > 260 ? verseText.slice(0, 257).trim() + '…' : verseText;
    wrapCanvasText(ctx, `“${quote}”`, size / 2, size / 2 - 20, size - 220, 62);

    ctx.fillStyle = '#cda45e';
    ctx.font = '700 32px "Space Grotesk", sans-serif';
    ctx.fillText(refText, size / 2, size - 160);

    ctx.fillStyle = '#9d97ab';
    ctx.font = '600 24px "Space Grotesk", sans-serif';
    ctx.fillText('Bible Bot', size / 2, size - 96);

    return canvas;
  }

  async function shareVerseAsImage(refText, verseText, kicker, btn) {
    const labelEl = btn ? $('.label', btn) : null;
    const original = labelEl ? labelEl.textContent : null;
    if (labelEl) labelEl.textContent = 'Making…';
    try {
      const canvas = await generateVerseImage(refText, verseText, kicker);
      canvas.toBlob(async (blob) => {
        if (!blob) { if (labelEl) labelEl.textContent = original; return; }
        const file = new File([blob], 'bible-bot-verse.png', { type: 'image/png' });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Bible Bot', text: `${verseText} — ${refText}` });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'bible-bot-verse.png';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
          }
        } catch {}
        if (labelEl) { labelEl.textContent = 'Shared!'; setTimeout(() => { labelEl.textContent = original; }, 1500); }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      if (labelEl) labelEl.textContent = original;
    }
  }

  /* ---------------- Footer share ---------------- */
  function initFooterShare() {
    if (!els.footerShareBtn) return;
    els.footerShareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'Bible Bot',
        text: 'Bible Bot — free Bible search with audio, a weekly growth planner, and Scripture by ancient geography.',
        url: location.origin + location.pathname,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }
      } catch {}
      try {
        await navigator.clipboard.writeText(shareData.url);
        const original = els.footerShareBtn.textContent;
        els.footerShareBtn.textContent = 'Link copied!';
        setTimeout(() => { els.footerShareBtn.textContent = original; }, 1500);
      } catch {}
    });
  }

  /* ---------------- Nav / view switching ---------------- */
  function switchView(view) {
    state.view = view;
    els.navTabs.forEach(tab => {
      const active = tab.dataset.view === view;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    els.searchView.hidden = view !== 'search';
    els.plannerView.hidden = view !== 'planner';
    els.geoView.hidden = view !== 'geo';
    els.timelineView.hidden = view !== 'timeline';
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      els.audioBar.hidden = true;
      resetSpeakButton();
    }
  }

  function initNav() {
    els.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });
  }

  /* ---------------- URL sync ---------------- */
  function syncUrl() {
    if (state.view !== 'search') return;
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
    initFontSize();
    renderQuickTags();
    initEvents();
    initTranslationToggle();
    initNav();
    initPlanner();
    initFooterShare();
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
    initGeo();
    initTimeline();

    Object.keys(TRANSLATIONS).forEach(key => {
      if (key !== state.translation) loadTranslation(key).catch(() => {});
    });

    const sharedLoaded = tryLoadSharedPlan();
    if (!sharedLoaded) {
      if (location.hash === '#planner') switchView('planner');
      else if (location.hash === '#geo') switchView('geo');
      else if (location.hash === '#timeline') switchView('timeline');
      const params = new URL(location.href).searchParams;
      const initialQ = params.get('q');
      if (initialQ) {
        els.input.value = initialQ;
        runSearch();
      }
    }

    window.addEventListener('hashchange', () => { tryLoadSharedPlan(); });

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

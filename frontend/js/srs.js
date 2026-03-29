/**
 * Spaced Repetition System — SM-2 algorithm
 *
 * Stores all card state in localStorage under the key 'viet_srs'.
 * Cards are keyed by "word|word_type" to distinguish homophones
 * (e.g. ba|number vs ba|noun).
 *
 * Quality ratings passed to review():
 *   1 = Again  (complete blank / fail)
 *   3 = Hard   (correct but difficult)
 *   4 = Good   (correct with normal effort)
 *   5 = Easy   (instant recall)
 */

const SRS = (() => {
  const STORAGE_KEY        = 'viet_srs';
  const NEW_CARDS_PER_DAY  = 10;
  const MIN_EASE_FACTOR    = 1.3;
  const INITIAL_EASE_FACTOR = 2.5;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function todayStr() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function addDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function cardKey(word, wordType) {
    return `${word}|${wordType}`;
  }

  // ── localStorage ───────────────────────────────────────────────────────────

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { cards: {}, newCardsToday: 0, lastStudyDate: '' };
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // ── SM-2 core ──────────────────────────────────────────────────────────────

  function freshCard(word, wordType) {
    return {
      word,
      wordType,
      interval: 0,
      repetitions: 0,
      easeFactor: INITIAL_EASE_FACTOR,
      dueDate: todayStr()
    };
  }

  /**
   * Apply one SM-2 review step.
   * Returns an updated copy of the card — does not mutate.
   */
  function applyReview(card, quality) {
    const c = { ...card };

    if (quality < 3) {
      // Fail: reset to start
      c.repetitions = 0;
      c.interval = 1;
    } else {
      // Pass: advance interval
      if (c.repetitions === 0)      c.interval = 1;
      else if (c.repetitions === 1) c.interval = 6;
      else                          c.interval = Math.round(c.interval * c.easeFactor);

      // Update ease factor (SM-2 formula)
      c.easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
      if (c.easeFactor < MIN_EASE_FACTOR) c.easeFactor = MIN_EASE_FACTOR;

      c.repetitions++;
    }

    c.dueDate = addDays(c.interval);
    return c;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Build the session queue for today:
   *   - All cards already learned that are due
   *   - New cards up to the remaining daily allowance
   * Order: due reviews first, then new cards.
   */
  function getSessionQueue(allWords) {
    const state = loadState();
    const today = todayStr();

    // Reset daily new-card counter on a new day
    if (state.lastStudyDate !== today) {
      state.newCardsToday = 0;
      state.lastStudyDate = today;
      saveState(state);
    }

    const due = [];
    const unseen = [];

    for (const word of allWords) {
      const key = cardKey(word.word, word.word_type);
      if (state.cards[key]) {
        if (state.cards[key].dueDate <= today) due.push(word);
      } else {
        unseen.push(word);
      }
    }

    const newSlots = Math.max(0, NEW_CARDS_PER_DAY - state.newCardsToday);
    return [...due, ...unseen.slice(0, newSlots)];
  }

  /**
   * Record a review result and persist to localStorage.
   * quality: 1 | 3 | 4 | 5
   */
  function review(word, wordType, quality) {
    const state = loadState();
    const today = todayStr();
    const key = cardKey(word, wordType);
    const isNew = !state.cards[key];

    state.cards[key] = applyReview(state.cards[key] || freshCard(word, wordType), quality);

    if (isNew) {
      if (state.lastStudyDate !== today) {
        state.newCardsToday = 0;
        state.lastStudyDate = today;
      }
      state.newCardsToday++;
    }

    saveState(state);
  }

  /**
   * Return display counts for the stats bar.
   */
  function getStats(allWords) {
    const state = loadState();
    const today = todayStr();
    const newCardsSoFarToday = state.lastStudyDate === today ? state.newCardsToday : 0;

    let dueCount = 0;
    let unseenCount = 0;

    for (const word of allWords) {
      const key = cardKey(word.word, word.word_type);
      if (state.cards[key]) {
        if (state.cards[key].dueDate <= today) dueCount++;
      } else {
        unseenCount++;
      }
    }

    const newToday = Math.min(unseenCount, Math.max(0, NEW_CARDS_PER_DAY - newCardsSoFarToday));
    return { dueCount, newToday, totalCount: allWords.length };
  }

  return { getSessionQueue, review, getStats };
})();

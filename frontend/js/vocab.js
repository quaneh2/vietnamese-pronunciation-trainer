/**
 * Vocabulary Mode — Anki-style spaced repetition UI
 *
 * Depends on srs.js being loaded first.
 *
 * Flow:
 *   1. User opens Vocabulary tab → sees stats + "Start Session" button
 *   2. Session builds a queue (due reviews + new cards)
 *   3. Each card shows the Vietnamese word; user clicks "Show Answer"
 *   4. Answer revealed: translation + random example sentence
 *   5. User rates with Again / Hard / Good / Easy
 *   6. Repeat until queue exhausted → session complete screen
 */

const VocabMode = (() => {
  let allWords = [];
  let queue    = [];
  let current  = 0;

  const el = id => document.getElementById(id);

  // ── Session lifecycle ──────────────────────────────────────────────────────

  function init(words) {
    allWords = words;
    refreshStats();
    showScreen('start');
  }

  function startSession() {
    queue   = SRS.getSessionQueue(allWords);
    current = 0;

    if (queue.length === 0) {
      el('vocab-complete-message').textContent =
        'No cards due today. Come back tomorrow!';
      showScreen('complete');
      return;
    }

    showScreen('card');
    updateSessionProgress();
    showQuestion();
  }

  function showQuestion() {
    const card = queue[current];

    el('card-word').textContent = card.word;
    el('card-type').textContent = card.word_type;

    // Hide answer, show prompt
    el('card-answer').style.display   = 'none';
    el('rating-buttons').style.display = 'none';
    el('show-answer-btn').style.display = 'inline-block';

    el('vocab-word-card').classList.remove('is-answered');
    updateSessionProgress();
  }

  function revealAnswer() {
    const card = queue[current];

    el('card-translation').textContent = card.translation;

    // Pick a random example sentence
    const examples = card.examples || [];
    if (examples.length > 0) {
      const ex = examples[Math.floor(Math.random() * examples.length)];
      el('card-example').innerHTML =
        `<p class="example-viet">${ex.vietnamese}</p>` +
        `<p class="example-eng">${ex.english}</p>`;
      el('card-example').style.display = 'block';
    } else {
      el('card-example').style.display = 'none';
    }

    el('card-answer').style.display    = 'block';
    el('rating-buttons').style.display = 'flex';
    el('show-answer-btn').style.display = 'none';
    el('vocab-word-card').classList.add('is-answered');
  }

  function rate(quality) {
    const card = queue[current];
    SRS.review(card.word, card.word_type, quality);
    current++;
    refreshStats();

    if (current >= queue.length) {
      el('vocab-complete-message').textContent =
        `${queue.length} card${queue.length !== 1 ? 's' : ''} reviewed. ` +
        `Come back tomorrow for your next session.`;
      showScreen('complete');
    } else {
      showQuestion();
    }
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  function showScreen(name) {
    el('vocab-start-section').style.display  = name === 'start'    ? 'block' : 'none';
    el('vocab-card').style.display           = name === 'card'     ? 'block' : 'none';
    el('vocab-complete').style.display       = name === 'complete' ? 'block' : 'none';
  }

  function refreshStats() {
    const stats = SRS.getStats(allWords);
    el('srs-stats-new').textContent = `${stats.newToday} new`;
    el('srs-stats-due').textContent = `${stats.dueCount} due`;
  }

  function updateSessionProgress() {
    const total = queue.length;
    const done  = current;
    const pct   = total > 0 ? (done / total) * 100 : 0;

    el('session-progress-fill').style.width = `${pct}%`;
    el('session-progress-text').textContent = `${done} / ${total} cards`;
  }

  // ── Event wiring ───────────────────────────────────────────────────────────

  function setupEvents() {
    el('vocab-start-btn').addEventListener('click',    startSession);
    el('vocab-restart-btn').addEventListener('click',  startSession);
    el('show-answer-btn').addEventListener('click',    revealAnswer);
    el('btn-again').addEventListener('click', () => rate(1));
    el('btn-hard').addEventListener('click',  () => rate(3));
    el('btn-good').addEventListener('click',  () => rate(4));
    el('btn-easy').addEventListener('click',  () => rate(5));
  }

  return { init, setupEvents };
})();

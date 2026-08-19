/**
 * Practice View Component (Core Flow)
 * Implements N-word selection with A-Res, 2 sentences per word, audio playback,
 * reveal meanings toggle, and calendar-day-limited "Mark Learned" button.
 */

import { StorageService, getTodayDateString } from '../services/storage.js';
import { createPracticeSession, calculateWordWeight } from '../services/sampling.js';
import { audioPlayer } from '../services/audio-player.js';
import { escapeHtml, escapeRegex } from '../utils/html.js';

export class PracticeView {
  constructor(container, onNavigate) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.sessionWords = [];
    this.allMeaningsRevealed = false;
    this.maskWordInSentences = false;
    this.activeAudioId = null;

    // Listen to audio player events
    this.unsubscribeAudio = audioPlayer.subscribe((event) => {
      this.handleAudioEvent(event);
    });
  }

  destroy() {
    if (this.unsubscribeAudio) {
      this.unsubscribeAudio();
    }
    audioPlayer.stop();
  }

  init() {
    this.refreshSession();
  }

  refreshSession() {
    audioPlayer.stop();
    const allWords = StorageService.getWords();
    const settings = StorageService.getSettings();

    if (allWords.length === 0) {
      this.sessionWords = [];
      this.renderEmptyState();
      return;
    }

    const n = Math.min(settings.sessionWordCount || 5, allWords.length);
    const sentencesPerWord = settings.sentencesPerWord || 2;
    this.sessionWords = createPracticeSession(allWords, n, sentencesPerWord);
    // createPracticeSession mutates word.sentenceBag on the selected words (shuffle-bag
    // state for no-repeat sentence picking) — persist it so the guarantee holds across sessions.
    StorageService.saveWords(allWords);
    this.allMeaningsRevealed = false;
    this.render();
  }

  toggleAllMeanings() {
    this.allMeaningsRevealed = !this.allMeaningsRevealed;
    this.sessionWords.forEach(w => {
      w.revealed = this.allMeaningsRevealed;
    });
    this.render();
  }

  toggleWordMeaning(wordId) {
    const word = this.sessionWords.find(w => w.id === wordId);
    if (word) {
      word.revealed = !word.revealed;
      this.render();
    }
  }

  toggleMasking() {
    this.maskWordInSentences = !this.maskWordInSentences;
    this.render();
  }

  handleMarkLearned(wordId) {
    const res = StorageService.markWordLearned(wordId);
    if (res.success) {
      // Update in current session
      const word = this.sessionWords.find(w => w.id === wordId);
      if (word) {
        word.masteryLevel = res.word.masteryLevel;
        word.lastLearnedDate = res.word.lastLearnedDate;
      }
      this.render();
      this.showToast(`🎉 "${res.word.normalizedWord}" reached Level ${res.word.masteryLevel}! (Updated for today)`);
    } else if (res.alreadyLearnedToday) {
      this.showToast(`ℹ️ "${res.word.normalizedWord}" was already marked learned today. (Max 1x per calendar day)`, 'info');
    }
  }

  handleAudioEvent(event) {
    const { type, sentenceId } = event;
    const btns = this.container.querySelectorAll(`[data-audio-id="${sentenceId}"]`);
    btns.forEach(btn => {
      if (type === 'play') {
        btn.classList.add('playing');
        btn.classList.remove('loading');
        btn.innerHTML = `<span class="icon">⏸</span><span>Stop</span>`;
      } else if (type === 'stop') {
        btn.classList.remove('playing');
        btn.classList.remove('loading');
        btn.innerHTML = `<span class="icon">🔊</span><span>Listen</span>`;
      } else if (type === 'loading') {
        if (event.isLoading) {
          btn.classList.add('loading');
          btn.innerHTML = `<span class="spinner"></span><span>Loading audio...</span>`;
        } else {
          btn.classList.remove('loading');
        }
      }
    });
  }

  showToast(message, type = 'success') {
    const existing = document.getElementById('vtl-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'vtl-toast';
    toast.className = `toast toast-${type} toast-enter`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-icon">📖</div>
        <h2>No Words in Vocabulary</h2>
        <p>Add your first German vocabulary or expressions to start learning from context.</p>
        <button class="btn btn-primary" id="btn-empty-add">
          <span>➕ Add Your First Words</span>
        </button>
      </div>
    `;

    this.container.querySelector('#btn-empty-add')?.addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate('add');
    });
  }

  render() {
    if (this.sessionWords.length === 0) {
      this.renderEmptyState();
      return;
    }

    const today = getTodayDateString();
    const allWords = StorageService.getWords();

    let html = `
      <div class="practice-header">
        <div class="practice-title-group">
          <h2>Learn in Context</h2>
          <span class="session-badge">${this.sessionWords.length} of ${allWords.length} words selected (A-Res)</span>
        </div>

        <div class="practice-controls">
          <button class="btn btn-secondary btn-sm" id="btn-toggle-mask" title="Mask word in sentences to test context guessing (Cloze Mode)">
            <span>${this.maskWordInSentences ? '👁️ Show Words' : '🎭 Cloze Mode'}</span>
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-meanings" title="Keyboard shortcut: M">
            <span>${this.allMeaningsRevealed ? '🙈 Hide Meanings' : '💡 Show All Meanings'}</span>
          </button>
          <button class="btn btn-primary btn-sm" id="btn-refresh-session" title="Keyboard shortcut: R">
            <span class="icon">🔄</span>
            <span>Refresh (R)</span>
          </button>
        </div>
      </div>

      <div class="word-cards-grid">
    `;

    this.sessionWords.forEach((word, index) => {
      const isLearnedToday = word.lastLearnedDate === today;
      const weight = calculateWordWeight(word.masteryLevel || 0);
      const weightPercent = (weight * 100).toFixed(0);
      const isRevealed = word.revealed;

      html += `
        <article class="word-card ${isRevealed ? 'revealed' : ''}" data-word-id="${word.id}">
          <header class="word-card-header">
            <div class="word-main-info">
              <div class="word-title-row">
                <span class="word-number">#${index + 1}</span>
                <h3 class="word-title">${escapeHtml(word.normalizedWord || word.rawInput)}</h3>
                ${word.partOfSpeech ? `<span class="badge badge-pos">${escapeHtml(word.partOfSpeech)}</span>` : ''}
              </div>
              <div class="mastery-info-row">
                <span class="badge badge-mastery ${word.masteryLevel >= 4 ? 'mastered' : ''}">
                  Level ${word.masteryLevel || 0}
                </span>
                <span class="weight-label" title="Selection probability weight (0.4 ^ level)">
                  ${weightPercent}% frequency
                </span>
              </div>
            </div>

            <div class="word-header-actions">
              <button 
                class="btn ${isLearnedToday ? 'btn-learned-done' : 'btn-learned'}"
                data-action="mark-learned"
                data-word-id="${word.id}"
                title="${isLearnedToday ? 'Already recorded today (max 1 count per calendar day)' : 'Increases level by 1 and reduces reappearance frequency'}"
              >
                ${isLearnedToday ? '✓ Learned Today' : '⭐ Mark as Learned'}
              </button>
            </div>
          </header>

          <section class="word-sentences-list">
            ${(word.activeSentences || []).map((s, sIdx) => {
              let sentenceDisplay = escapeHtml(s.german);
              if (this.maskWordInSentences) {
                // Mask the word or stem
                const stem = (word.normalizedWord || word.rawInput)
                  .replace(/^(der|die|das|sich)\s+/i, '')
                  .trim();
                if (stem.length > 2) {
                  const stemPattern = escapeRegex(stem.slice(0, Math.max(3, stem.length - 2)));
                  const regex = new RegExp(`\\b(${stemPattern}[a-zäöüß]*)\\b`, 'gi');
                  sentenceDisplay = sentenceDisplay.replace(regex, `<span class="cloze-blank">[ _____ ]</span>`);
                }
              }

              return `
                <div class="sentence-item">
                  <div class="sentence-text-wrap">
                    <span class="sentence-index">${sIdx + 1}.</span>
                    <p class="sentence-german">${sentenceDisplay}</p>
                    ${isRevealed && s.englishHint ? `<p class="sentence-hint">${escapeHtml(s.englishHint)}</p>` : ''}
                  </div>
                  <div class="sentence-audio-wrap">
                    <button 
                      class="btn-audio ${audioPlayer.isPlaying(s.id) ? 'playing' : ''} ${audioPlayer.isLoading(s.id) ? 'loading' : ''}" 
                      data-audio-id="${s.id}" 
                      data-audio-text="${encodeURIComponent(s.german)}"
                      title="Listen to audio (clear & slightly slow)"
                    >
                      <span class="icon">${audioPlayer.isPlaying(s.id) ? '⏸' : '🔊'}</span>
                      <span>${audioPlayer.isPlaying(s.id) ? 'Stop' : 'Listen'}</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </section>

          <footer class="word-meaning-section">
            <button class="btn btn-reveal-toggle ${isRevealed ? 'active' : ''}" data-action="toggle-meaning" data-word-id="${word.id}">
              <span class="icon">${isRevealed ? '▼' : '💡'}</span>
              <span>${isRevealed ? 'Hide Meaning & Breakdown' : 'Reveal Meaning & Grammar'}</span>
            </button>

            ${isRevealed ? `
              <div class="meaning-drawer open animate-fade-in">
                <div class="meaning-header-row">
                  <span class="meaning-badge-label">✨ DEFINITION & GRAMMAR</span>
                  ${word.article ? `<span class="badge badge-article">${escapeHtml(word.article)}</span>` : ''}
                </div>

                <div class="meaning-hero-card">
                  <span class="meaning-label-sub">English Meaning:</span>
                  <p class="meaning-primary-text">${escapeHtml(word.meaning) || 'No meaning provided'}</p>
                </div>

                ${word.plural || word.verbForms || word.governingPrepositions ? `
                  <div class="meaning-sub-section">
                    <span class="sub-section-title">Grammatical Forms</span>
                    <div class="grammar-chips">
                      ${word.plural ? `<div class="chip"><span class="chip-label">Plural:</span> <strong>${escapeHtml(word.plural)}</strong></div>` : ''}
                      ${word.verbForms ? `<div class="chip"><span class="chip-label">Verb Forms:</span> <strong>${escapeHtml(word.verbForms)}</strong></div>` : ''}
                      ${word.governingPrepositions ? `<div class="chip"><span class="chip-label">Governing:</span> <strong>${escapeHtml(word.governingPrepositions)}</strong></div>` : ''}
                    </div>
                  </div>
                ` : ''}

                ${word.fixedExpressions && word.fixedExpressions.length > 0 ? `
                  <div class="meaning-sub-section fixed-expressions-card">
                    <span class="sub-section-title">💬 Fixed Expressions & Collocations</span>
                    <ul class="fixed-expressions-list">
                      ${word.fixedExpressions.map(exp => `<li>${escapeHtml(exp)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${word.memoryHook ? `
                  <div class="memory-hook-card">
                    <span class="hook-icon">🧠</span>
                    <div class="hook-content">
                      <span class="hook-title">Memory Hook (Mnemonic)</span>
                      <p class="hook-body">${escapeHtml(word.memoryHook)}</p>
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </footer>
        </article>
      `;
    });

    html += `</div>`;
    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Refresh button
    this.container.querySelector('#btn-refresh-session')?.addEventListener('click', () => {
      this.refreshSession();
    });

    // Toggle all meanings
    this.container.querySelector('#btn-toggle-meanings')?.addEventListener('click', () => {
      this.toggleAllMeanings();
    });

    // Toggle masking mode
    this.container.querySelector('#btn-toggle-mask')?.addEventListener('click', () => {
      this.toggleMasking();
    });

    // Individual word actions
    this.container.querySelectorAll('[data-action="mark-learned"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wordId = btn.getAttribute('data-word-id');
        this.handleMarkLearned(wordId);
      });
    });

    this.container.querySelectorAll('[data-action="toggle-meaning"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wordId = btn.getAttribute('data-word-id');
        this.toggleWordMeaning(wordId);
      });
    });

    // Audio play buttons
    this.container.querySelectorAll('.btn-audio').forEach(btn => {
      btn.addEventListener('click', () => {
        const sentenceId = btn.getAttribute('data-audio-id');
        const text = decodeURIComponent(btn.getAttribute('data-audio-text') || '');
        audioPlayer.playSentence(sentenceId, text);
      });
    });
  }
}

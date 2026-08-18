/**
 * Vocabulary Management View
 * List all words, filter by mastery, view all 10 sentences, manage audio blobs, delete/edit.
 */

import { StorageService, getTodayDateString } from '../services/storage.js';
import { audioDb } from '../services/db.js';
import { audioPlayer } from '../services/audio-player.js';
import { calculateWordWeight } from '../services/sampling.js';

export class VocabView {
  constructor(container, onNavigate) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.searchQuery = '';
    this.filterMastery = 'all';
    this.expandedWordId = null;

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
    this.render();
  }

  handleAudioEvent(event) {
    const { type, sentenceId } = event;
    const btns = this.container.querySelectorAll(`[data-audio-id="${sentenceId}"]`);
    btns.forEach(btn => {
      if (type === 'play') {
        btn.classList.add('playing');
        btn.classList.remove('loading');
        btn.innerHTML = `<span class="icon">⏸</span>`;
      } else if (type === 'stop') {
        btn.classList.remove('playing');
        btn.classList.remove('loading');
        btn.innerHTML = `<span class="icon">🔊</span>`;
      } else if (type === 'loading') {
        if (event.isLoading) {
          btn.classList.add('loading');
          btn.innerHTML = `<span class="spinner"></span>`;
        } else {
          btn.classList.remove('loading');
        }
      }
    });
  }

  async deleteWord(wordId) {
    const word = StorageService.getWordById(wordId);
    if (!word) return;

    if (confirm(`Are you sure you want to delete "${word.normalizedWord || word.rawInput}"?`)) {
      // Clean up audio blobs from IndexedDB
      if (word.sentences && word.sentences.length > 0) {
        const sentenceIds = word.sentences.map(s => s.id);
        await audioDb.deleteMultiple(sentenceIds);
      }
      StorageService.deleteWord(wordId);
      this.render();
    }
  }

  setMastery(wordId, level) {
    StorageService.setMasteryLevel(wordId, level);
    this.render();
  }

  toggleExpandWord(wordId) {
    this.expandedWordId = this.expandedWordId === wordId ? null : wordId;
    this.render();
  }

  render() {
    const allWords = StorageService.getWords();
    const today = getTodayDateString();

    // Filter words
    const filteredWords = allWords.filter(w => {
      const matchSearch = !this.searchQuery || 
        w.normalizedWord.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        w.meaning.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (w.rawInput && w.rawInput.toLowerCase().includes(this.searchQuery.toLowerCase()));

      let matchFilter = true;
      if (this.filterMastery === 'new') {
        matchFilter = (w.masteryLevel || 0) === 0;
      } else if (this.filterMastery === 'learning') {
        matchFilter = (w.masteryLevel || 0) >= 1 && (w.masteryLevel || 0) < 4;
      } else if (this.filterMastery === 'mastered') {
        matchFilter = (w.masteryLevel || 0) >= 4;
      }

      return matchSearch && matchFilter;
    });

    const stats = StorageService.getStats();

    let html = `
      <div class="vocab-header">
        <div class="vocab-title-group">
          <h2>Vocabulary Library</h2>
          <p class="vocab-subtitle">Manage your vocabulary words, review sentence pools, and adjust mastery levels.</p>
        </div>

        <div class="vocab-actions">
          <button class="btn btn-primary" id="btn-vocab-add">
            <span>➕ Add New Words</span>
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${stats.total}</span>
          <span class="stat-label">Total Words</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.learnedToday}</span>
          <span class="stat-label">Learned Today</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.newCount}</span>
          <span class="stat-label">New (Level 0)</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.inProgressCount}</span>
          <span class="stat-label">Learning (1-3)</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.masteredCount}</span>
          <span class="stat-label">Mastered (4+)</span>
        </div>
      </div>

      <!-- Filter / Search Bar -->
      <div class="vocab-filter-bar card">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="vocab-search" 
            placeholder="Search word, meaning, or expression..." 
            value="${this.searchQuery}"
            class="input-text"
          />
          ${this.searchQuery ? `<button class="btn-clear" id="btn-clear-search">✕</button>` : ''}
        </div>

        <div class="filter-pills">
          <button class="pill ${this.filterMastery === 'all' ? 'active' : ''}" data-filter="all">
            All (${stats.total})
          </button>
          <button class="pill ${this.filterMastery === 'new' ? 'active' : ''}" data-filter="new">
            New (${stats.newCount})
          </button>
          <button class="pill ${this.filterMastery === 'learning' ? 'active' : ''}" data-filter="learning">
            Learning (${stats.inProgressCount})
          </button>
          <button class="pill ${this.filterMastery === 'mastered' ? 'active' : ''}" data-filter="mastered">
            Mastered (${stats.masteredCount})
          </button>
        </div>
      </div>

      <!-- Words List -->
      <div class="vocab-list">
    `;

    if (filteredWords.length === 0) {
      html += `
        <div class="empty-state card">
          <p>No vocabulary words found matching your selection.</p>
        </div>
      `;
    } else {
      filteredWords.forEach(word => {
        const isExpanded = this.expandedWordId === word.id;
        const weight = calculateWordWeight(word.masteryLevel || 0);
        const weightPercent = (weight * 100).toFixed(0);

        html += `
          <div class="vocab-item card ${isExpanded ? 'expanded' : ''}" data-word-id="${word.id}">
            <div class="vocab-item-summary">
              <div class="vocab-item-main" data-action="toggle-expand" data-word-id="${word.id}">
                <div class="vocab-item-title-row">
                  <span class="vocab-word">${word.normalizedWord || word.rawInput}</span>
                  ${word.partOfSpeech ? `<span class="badge badge-pos">${word.partOfSpeech}</span>` : ''}
                  <span class="badge badge-mastery ${word.masteryLevel >= 4 ? 'mastered' : ''}">
                    Level ${word.masteryLevel || 0}
                  </span>
                  <span class="weight-label">${weightPercent}% frequency</span>
                </div>
                <div class="vocab-item-meaning">
                  ${word.meaning || '<span class="text-muted">No meaning provided</span>'}
                </div>
              </div>

              <div class="vocab-item-actions">
                <div class="mastery-stepper">
                  <label>Level:</label>
                  <select class="select-sm select-mastery" data-word-id="${word.id}">
                    ${[0, 1, 2, 3, 4, 5, 6, 7].map(lvl => `
                      <option value="${lvl}" ${word.masteryLevel === lvl ? 'selected' : ''}>${lvl}</option>
                    `).join('')}
                  </select>
                </div>
                <button class="btn btn-icon btn-secondary" data-action="toggle-expand" data-word-id="${word.id}" title="View all 10 sentences">
                  <span>${isExpanded ? '▲' : '▼'} (${word.sentences?.length || 0} Sentences)</span>
                </button>
                <button class="btn btn-icon btn-danger" data-action="delete-word" data-word-id="${word.id}" title="Delete word">
                  <span>🗑️</span>
                </button>
              </div>
            </div>

            ${isExpanded ? `
              <div class="vocab-item-details animate-fade-in">
                <div class="details-grid">
                  <div class="details-section">
                    <h4>Grammatical Details</h4>
                    <ul class="details-list">
                      ${word.article ? `<li><strong>Article:</strong> ${word.article}</li>` : ''}
                      ${word.plural ? `<li><strong>Plural:</strong> ${word.plural}</li>` : ''}
                      ${word.verbForms ? `<li><strong>Verb Forms:</strong> ${word.verbForms}</li>` : ''}
                      ${word.governingPrepositions ? `<li><strong>Governing:</strong> ${word.governingPrepositions}</li>` : ''}
                    </ul>
                  </div>

                  ${word.fixedExpressions && word.fixedExpressions.length > 0 ? `
                    <div class="details-section">
                      <h4>Fixed Expressions</h4>
                      <ul class="details-list">
                        ${word.fixedExpressions.map(e => `<li>${e}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${word.memoryHook ? `
                    <div class="details-section">
                      <h4>Memory Hook</h4>
                      <p class="hook-text">🧠 ${word.memoryHook}</p>
                    </div>
                  ` : ''}
                </div>

                <div class="details-sentences-header">
                  <h4>Full Sentence Pool (${word.sentences?.length || 0} Sentences)</h4>
                  <small>In practice mode, 2 random sentences are chosen from this pool for each session.</small>
                </div>

                <div class="details-sentences-list">
                  ${(word.sentences || []).map((s, idx) => `
                    <div class="detail-sentence-row">
                      <span class="sentence-idx">${idx + 1}.</span>
                      <div class="sentence-content">
                        <p class="sentence-german-text">${s.german}</p>
                        ${s.englishHint ? `<p class="sentence-english-hint">${s.englishHint}</p>` : ''}
                      </div>
                      <button 
                        class="btn-icon-audio ${audioPlayer.isPlaying(s.id) ? 'playing' : ''} ${audioPlayer.isLoading(s.id) ? 'loading' : ''}"
                        data-audio-id="${s.id}"
                        data-audio-text="${encodeURIComponent(s.german)}"
                        title="Play audio"
                      >
                        <span class="icon">${audioPlayer.isPlaying(s.id) ? '⏸' : '🔊'}</span>
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      });
    }

    html += `</div>`;
    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Add button
    this.container.querySelector('#btn-vocab-add')?.addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate('add');
    });

    // Search input
    const searchInput = this.container.querySelector('#vocab-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        // keep focus
        const newSearch = this.container.querySelector('#vocab-search');
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    this.container.querySelector('#btn-clear-search')?.addEventListener('click', () => {
      this.searchQuery = '';
      this.render();
    });

    // Filter pills
    this.container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterMastery = btn.getAttribute('data-filter');
        this.render();
      });
    });

    // Expand toggle
    this.container.querySelectorAll('[data-action="toggle-expand"]').forEach(elem => {
      elem.addEventListener('click', () => {
        const wordId = elem.getAttribute('data-word-id');
        this.toggleExpandWord(wordId);
      });
    });

    // Delete word
    this.container.querySelectorAll('[data-action="delete-word"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wordId = btn.getAttribute('data-word-id');
        this.deleteWord(wordId);
      });
    });

    // Change mastery
    this.container.querySelectorAll('.select-mastery').forEach(select => {
      select.addEventListener('change', (e) => {
        const wordId = select.getAttribute('data-word-id');
        const val = parseInt(e.target.value, 10);
        this.setMastery(wordId, val);
      });
    });

    // Audio play
    this.container.querySelectorAll('.btn-icon-audio').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sentenceId = btn.getAttribute('data-audio-id');
        const text = decodeURIComponent(btn.getAttribute('data-audio-text') || '');
        audioPlayer.playSentence(sentenceId, text);
      });
    });
  }
}

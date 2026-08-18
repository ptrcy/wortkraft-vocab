/**
 * Add Words View
 * Single or Batch addition of German vocabulary.
 * Orchestrates OpenAI sentence/explanation generation and Gemini audio pre-generation.
 */

import { StorageService } from '../services/storage.js';
import { OpenAIService } from '../services/openai.js';
import { GeminiService } from '../services/gemini.js';
import { audioDb } from '../services/db.js';
import { SAMPLE_WORDS } from '../data/sample-words.js';

export class AddView {
  constructor(container, onNavigate) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.isGenerating = false;
    this.mode = 'single'; // 'single' | 'batch'
  }

  init() {
    this.render();
  }

  destroy() {
    // cleanup
  }

  getPosHint(text) {
    if (!text || text.trim().length === 0) return '';
    const clean = text.trim();
    const first = clean.charAt(0);
    if (first === first.toUpperCase() && isNaN(first)) {
      return 'Hint: Capitalized → likely Noun';
    } else {
      return 'Hint: Lowercase → likely Verb / Adjective';
    }
  }

  async processWordGeneration(rawWord, settings, onProgress) {
    onProgress(`Generating 10 example sentences and explanation for "${rawWord}" via OpenAI...`, 15);

    // 1. Generate text details with OpenAI
    const wordData = await OpenAIService.generateWordData(rawWord, {
      apiKey: settings.openaiApiKey,
      model: settings.openaiModel || 'gpt-4o-mini',
      baseUrl: settings.openaiBaseUrl || ''
    });

    onProgress(`Linguistic analysis complete. Synthesizing audio for ${wordData.sentences.length} sentences...`, 30);

    // 2. Pre-generate Audio via Gemini TTS if API key is present
    if (settings.geminiApiKey && wordData.sentences.length > 0) {
      const total = wordData.sentences.length;
      for (let i = 0; i < total; i++) {
        const sentence = wordData.sentences[i];
        const progressPct = 30 + Math.round(((i + 1) / total) * 65);
        onProgress(`Synthesizing Gemini TTS Audio (${i + 1}/${total}) for "${sentence.german.slice(0, 30)}..."`, progressPct);

        try {
          const audioBlob = await GeminiService.generateSpeechAudio(sentence.german, {
            apiKey: settings.geminiApiKey,
            model: settings.geminiModel || 'gemini-2.0-flash',
            voice: settings.geminiVoice || 'Puck'
          });
          // Cache to IndexedDB
          await audioDb.saveAudio(sentence.id, audioBlob);
        } catch (audioErr) {
          console.warn(`Audio generation failed for sentence ${sentence.id}:`, audioErr);
        }
      }
    } else {
      onProgress(`No Gemini API key set — audio will play on-demand using browser speech synthesis.`, 90);
    }

    // 3. Save word to storage
    StorageService.addWord(wordData);
    onProgress(`"${wordData.normalizedWord}" successfully added to your vocabulary!`, 100);
    return wordData;
  }

  async handleSingleSubmit(e) {
    e.preventDefault();
    const input = this.container.querySelector('#input-single-word');
    const word = input?.value.trim();
    if (!word) return;

    const settings = StorageService.getSettings();
    if (!settings.openaiApiKey) {
      alert('Please configure your OpenAI API key in Settings first to generate sentences.');
      if (this.onNavigate) this.onNavigate('settings');
      return;
    }

    this.startGenerationUI();

    try {
      await this.processWordGeneration(word, settings, (msg, pct) => {
        this.updateProgress(msg, pct);
      });

      this.showSuccessFeedback(word);
    } catch (err) {
      console.error(err);
      this.showErrorFeedback(err.message);
    } finally {
      this.isGenerating = false;
    }
  }

  async handleBatchSubmit(e) {
    e.preventDefault();
    const textarea = this.container.querySelector('#input-batch-words');
    const rawText = textarea?.value.trim();
    if (!rawText) return;

    const words = rawText
      .split(/[\n,;]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) return;

    const settings = StorageService.getSettings();
    if (!settings.openaiApiKey) {
      alert('Please configure your OpenAI API key in Settings first.');
      if (this.onNavigate) this.onNavigate('settings');
      return;
    }

    this.startGenerationUI();

    try {
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const overallPct = Math.round((i / words.length) * 100);
        this.updateProgress(`Processing word ${i + 1}/${words.length}: "${w}"...`, overallPct);

        await this.processWordGeneration(w, settings, (subMsg, subPct) => {
          const stepWeight = 1 / words.length;
          const weightedPct = Math.round((i * stepWeight + (subPct / 100) * stepWeight) * 100);
          this.updateProgress(`[${i + 1}/${words.length}] ${subMsg}`, weightedPct);
        });
      }

      this.showSuccessFeedback(`${words.length} words`);
    } catch (err) {
      console.error(err);
      this.showErrorFeedback(err.message);
    } finally {
      this.isGenerating = false;
    }
  }

  handleLoadSampleWords() {
    if (confirm('Do you want to import the B1 Starter Pack (8 words with 10 sentences and explanations each)?')) {
      StorageService.addMultipleWords(SAMPLE_WORDS);
      alert('Starter vocabulary pack successfully imported!');
      if (this.onNavigate) this.onNavigate('practice');
    }
  }

  startGenerationUI() {
    this.isGenerating = true;
    const formWrap = this.container.querySelector('.add-form-container');
    const progressWrap = this.container.querySelector('.generation-progress-wrap');
    if (formWrap) formWrap.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'block';
  }

  updateProgress(message, percent) {
    const pBar = this.container.querySelector('.progress-bar-fill');
    const pText = this.container.querySelector('.progress-text');
    const pLog = this.container.querySelector('.progress-log');

    if (pBar) pBar.style.width = `${Math.min(100, Math.max(5, percent))}%`;
    if (pText) pText.textContent = `${percent}%`;
    if (pLog) {
      const p = document.createElement('p');
      p.className = 'log-item';
      p.textContent = message;
      pLog.appendChild(p);
      pLog.scrollTop = pLog.scrollHeight;
    }
  }

  showSuccessFeedback(wordLabel) {
    const progressWrap = this.container.querySelector('.generation-progress-wrap');
    if (!progressWrap) return;

    progressWrap.innerHTML = `
      <div class="card success-card animate-fade-in">
        <div class="success-icon">✨</div>
        <h3>Successfully Generated!</h3>
        <p><strong>${wordLabel}</strong> was saved with 10 example sentences, audio, and linguistic breakdown.</p>
        <div class="success-buttons">
          <button class="btn btn-primary" id="btn-goto-practice">
            <span>📖 Practice Now</span>
          </button>
          <button class="btn btn-secondary" id="btn-add-more">
            <span>➕ Add More Words</span>
          </button>
        </div>
      </div>
    `;

    progressWrap.querySelector('#btn-goto-practice')?.addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate('practice');
    });

    progressWrap.querySelector('#btn-add-more')?.addEventListener('click', () => {
      this.render();
    });
  }

  showErrorFeedback(errorMessage) {
    const progressWrap = this.container.querySelector('.generation-progress-wrap');
    if (!progressWrap) return;

    progressWrap.innerHTML = `
      <div class="card error-card animate-fade-in">
        <div class="error-icon">⚠️</div>
        <h3>Generation Error</h3>
        <p class="error-message">${errorMessage}</p>
        <div class="error-actions">
          <button class="btn btn-primary" id="btn-retry">
            <span>🔄 Retry</span>
          </button>
          <button class="btn btn-secondary" id="btn-goto-settings">
            <span>⚙️ Check Settings</span>
          </button>
        </div>
      </div>
    `;

    progressWrap.querySelector('#btn-retry')?.addEventListener('click', () => {
      this.render();
    });

    progressWrap.querySelector('#btn-goto-settings')?.addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate('settings');
    });
  }

  render() {
    const settings = StorageService.getSettings();
    const hasKeys = !!settings.openaiApiKey;

    let html = `
      <div class="add-view-wrapper">
        <div class="add-header">
          <h2>Generate New Vocabulary</h2>
          <p class="add-subtitle">
            Enter a German word or expression. The AI will automatically pre-generate 10 contextual B1 example sentences, audio pronunciation, and a concise linguistic breakdown.
          </p>
        </div>

        ${!hasKeys ? `
          <div class="alert-banner alert-warning">
            <span class="alert-icon">🔑</span>
            <div class="alert-text">
              <strong>OpenAI API Key Required:</strong> To automatically generate 10 sentences and explanations, please configure your API key in Settings.
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-quick-settings">Go to Settings</button>
          </div>
        ` : ''}

        <div class="add-tabs">
          <button class="tab-btn ${this.mode === 'single' ? 'active' : ''}" id="tab-single">
            Single Word
          </button>
          <button class="tab-btn ${this.mode === 'batch' ? 'active' : ''}" id="tab-batch">
            Batch Input
          </button>
        </div>

        <div class="add-form-container card">
          ${this.mode === 'single' ? `
            <form id="form-single-word" class="add-form">
              <div class="form-group">
                <label for="input-single-word">German Word or Expression:</label>
                <div class="input-with-hint">
                  <input 
                    type="text" 
                    id="input-single-word" 
                    class="input-text input-lg" 
                    placeholder="e.g. Sehnsucht, verabreden, Feierabend, sich freuen auf..." 
                    autocomplete="off"
                    required
                  />
                  <div class="pos-live-hint" id="pos-live-hint">
                    Hint: Capitalized words suggest Noun, lowercase suggests Verb/Adjective.
                  </div>
                </div>
                <small class="form-hint">Article (der/die/das) is optional — the AI determines the correct gender and part of speech automatically.</small>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-lg">
                  <span class="icon">✨</span>
                  <span>Pre-generate 10 Sentences + Audio</span>
                </button>
              </div>
            </form>
          ` : `
            <form id="form-batch-words" class="add-form">
              <div class="form-group">
                <label for="input-batch-words">Enter multiple words (separated by commas or newlines):</label>
                <textarea 
                  id="input-batch-words" 
                  class="input-textarea" 
                  rows="6" 
                  placeholder="Sehnsucht&#10;Feierabend&#10;sich verabreden&#10;Gemütlichkeit&#10;nachvollziehen"
                  required
                ></textarea>
                <small class="form-hint">Each word will be pre-generated sequentially with 10 example sentences and audio.</small>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-lg">
                  <span class="icon">✨</span>
                  <span>Generate Batch</span>
                </button>
              </div>
            </form>
          `}
        </div>

        <!-- Progress wrap (hidden initially) -->
        <div class="generation-progress-wrap" style="display: none;">
          <div class="card progress-card">
            <h3>Generating Vocabulary Material...</h3>
            <p class="progress-sub">Please wait while example sentences and pronunciation audio are being prepared.</p>
            
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: 5%;"></div>
            </div>
            <div class="progress-percent-label">
              <span class="progress-text">5%</span>
            </div>

            <div class="progress-log" id="progress-log">
              <p class="log-item">Initializing generation...</p>
            </div>
          </div>
        </div>

        <!-- Quick starter pack -->
        <div class="sample-pack-card card">
          <div class="sample-pack-info">
            <h4>📦 Load B1 Starter Pack</h4>
            <p>Want to test the app right away without entering an API key? Load 8 authentic B1 vocabulary words with 10 pre-made sentences each.</p>
          </div>
          <button class="btn btn-secondary" id="btn-load-samples">
            <span>Import Starter Pack</span>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#tab-single')?.addEventListener('click', () => {
      this.mode = 'single';
      this.render();
    });

    this.container.querySelector('#tab-batch')?.addEventListener('click', () => {
      this.mode = 'batch';
      this.render();
    });

    this.container.querySelector('#btn-quick-settings')?.addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate('settings');
    });

    this.container.querySelector('#btn-load-samples')?.addEventListener('click', () => {
      this.handleLoadSampleWords();
    });

    // POS live hint
    const singleInput = this.container.querySelector('#input-single-word');
    const hintElem = this.container.querySelector('#pos-live-hint');
    if (singleInput && hintElem) {
      singleInput.addEventListener('input', (e) => {
        hintElem.textContent = this.getPosHint(e.target.value);
      });
    }

    // Single form submit
    this.container.querySelector('#form-single-word')?.addEventListener('submit', (e) => {
      this.handleSingleSubmit(e);
    });

    // Batch form submit
    this.container.querySelector('#form-batch-words')?.addEventListener('submit', (e) => {
      this.handleBatchSubmit(e);
    });
  }
}

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
import { escapeHtml } from '../utils/html.js';
import { runWithConcurrency } from '../utils/concurrency.js';

export class AddView {
  constructor(container, onNavigate) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.isGenerating = false;
    this.sentenceCount = 4; // 4-10, chosen per generation run
  }

  init() {
    this.render();
  }

  destroy() {
    // cleanup
  }

  async processWordGeneration(rawWord, settings, sentenceCount, onProgress) {
    onProgress(`Generating ${sentenceCount} example sentences and explanation for "${rawWord}" via OpenAI...`, 15);

    // 1. Generate text details with OpenAI
    const wordData = await OpenAIService.generateWordData(rawWord, {
      apiKey: settings.openaiApiKey,
      model: settings.openaiModel || 'gpt-4o-mini',
      baseUrl: settings.openaiBaseUrl || '',
      cefrLevel: settings.cefrLevel || 'B1',
      sentenceCount
    });

    onProgress(`Linguistic analysis complete. Synthesizing audio for ${wordData.sentences.length} sentences...`, 30);

    // 2. Pre-generate Audio via Gemini TTS if API key is present
    if (settings.geminiApiKey && wordData.sentences.length > 0) {
      const total = wordData.sentences.length;
      const workers = Math.max(1, Math.min(5, parseInt(settings.audioWorkers, 10) || 2));
      let completed = 0;

      await runWithConcurrency(wordData.sentences, async (sentence) => {
        try {
          const audioBlob = await GeminiService.generateSpeechAudio(sentence.german, {
            apiKey: settings.geminiApiKey,
            model: settings.geminiModel || 'gemini-3.1-flash-tts-preview',
            voice: settings.geminiVoice || 'Puck'
          });
          // Cache to IndexedDB
          await audioDb.saveAudio(sentence.id, audioBlob);
        } catch (audioErr) {
          console.warn(`Audio generation failed for sentence ${sentence.id}:`, audioErr);
        } finally {
          completed++;
          const progressPct = 30 + Math.round((completed / total) * 65);
          onProgress(`Synthesizing Gemini TTS Audio (${completed}/${total})...`, progressPct);
        }
      }, workers);
    } else {
      onProgress(`No Gemini API key set — audio will play on-demand using browser speech synthesis.`, 90);
    }

    // 3. Save word to storage
    StorageService.addWord(wordData);
    onProgress(`"${wordData.normalizedWord}" successfully added to your vocabulary!`, 100);
    return wordData;
  }

  async handleGenerateSubmit(e) {
    e.preventDefault();
    const textarea = this.container.querySelector('#input-words');
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

    if (words.length === 1) {
      try {
        await this.processWordGeneration(words[0], settings, this.sentenceCount, (msg, pct) => {
          this.updateProgress(msg, pct);
        });
        this.showSuccessFeedback(words[0]);
      } catch (err) {
        console.error(err);
        this.showErrorFeedback(err.message);
      } finally {
        this.isGenerating = false;
      }
      return;
    }

    const succeeded = [];
    const failed = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const overallPct = Math.round((i / words.length) * 100);
      this.updateProgress(`Processing word ${i + 1}/${words.length}: "${w}"...`, overallPct);

      try {
        await this.processWordGeneration(w, settings, this.sentenceCount, (subMsg, subPct) => {
          const stepWeight = 1 / words.length;
          const weightedPct = Math.round((i * stepWeight + (subPct / 100) * stepWeight) * 100);
          this.updateProgress(`[${i + 1}/${words.length}] ${subMsg}`, weightedPct);
        });
        succeeded.push(w);
      } catch (err) {
        // Isolate per-word failures so one bad word doesn't abort the rest of the batch.
        console.error(`Batch generation failed for "${w}":`, err);
        failed.push({ word: w, error: err.message });
        this.updateProgress(`⚠️ Failed to generate "${w}": ${err.message}`, overallPct);
      }
    }

    this.isGenerating = false;

    if (succeeded.length === 0) {
      this.showErrorFeedback(
        `All ${words.length} word(s) failed to generate. Last error: ${failed[failed.length - 1]?.error || 'Unknown error'}`
      );
    } else {
      this.showBatchSummary(succeeded, failed);
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
        <p><strong>${escapeHtml(wordLabel)}</strong> was saved with example sentences, audio, and linguistic breakdown.</p>
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

  showBatchSummary(succeeded, failed) {
    const progressWrap = this.container.querySelector('.generation-progress-wrap');
    if (!progressWrap) return;

    if (failed.length === 0) {
      this.showSuccessFeedback(`${succeeded.length} words`);
      return;
    }

    progressWrap.innerHTML = `
      <div class="card success-card animate-fade-in">
        <div class="success-icon">${succeeded.length > 0 ? '⚠️' : '❌'}</div>
        <h3>Batch Generation Finished with Errors</h3>
        <p>
          <strong>${succeeded.length}</strong> of <strong>${succeeded.length + failed.length}</strong>
          word(s) were generated and saved successfully. <strong>${failed.length}</strong> failed.
        </p>
        <div class="batch-failed-list">
          <span class="sub-section-title">Failed words:</span>
          <ul class="details-list">
            ${failed.map(f => `<li><strong>${escapeHtml(f.word)}</strong> — ${escapeHtml(f.error)}</li>`).join('')}
          </ul>
        </div>
        <div class="success-buttons">
          <button class="btn btn-primary" id="btn-goto-practice">
            <span>📖 Practice Now</span>
          </button>
          <button class="btn btn-secondary" id="btn-add-more">
            <span>➕ Retry / Add More Words</span>
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
        <p class="error-message">${escapeHtml(errorMessage)}</p>
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
    const cefrLevel = settings.cefrLevel || 'B1';

    let html = `
      <div class="add-view-wrapper">
        <div class="add-header">
          <h2>Generate New Vocabulary</h2>
          <p class="add-subtitle">
            Enter one or more German words or expressions. The AI will automatically pre-generate contextual ${escapeHtml(cefrLevel)}-level example sentences, audio pronunciation, and a concise linguistic breakdown for each. (Change the level in Settings.)
          </p>
        </div>

        ${!hasKeys ? `
          <div class="alert-banner alert-warning">
            <span class="alert-icon">🔑</span>
            <div class="alert-text">
              <strong>OpenAI API Key Required:</strong> To automatically generate example sentences and explanations, please configure your API key in Settings.
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-quick-settings">Go to Settings</button>
          </div>
        ` : ''}

        <div class="add-form-container card">
          <form id="form-words" class="add-form">
            <div class="form-group">
              <label id="sentence-count-heading">Sentences to Generate per Word:</label>
              <div class="stepper-control">
                <button type="button" class="stepper-btn" id="btn-sentence-decrement" aria-label="Decrease sentence count">−</button>
                <span class="stepper-value" id="sentence-count-label">${this.sentenceCount}</span>
                <button type="button" class="stepper-btn" id="btn-sentence-increment" aria-label="Increase sentence count">+</button>
              </div>
            </div>

            <div class="form-group">
              <label for="input-words">German Words or Expressions:</label>
              <textarea
                id="input-words"
                class="input-textarea"
                rows="6"
                placeholder="Sehnsucht&#10;Feierabend&#10;sich verabreden&#10;Gemütlichkeit&#10;nachvollziehen"
                required
              ></textarea>
              <small class="form-hint">One word or expression per line (or separated by commas). Article (der/die/das) is optional — the AI determines gender and part of speech automatically.</small>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-lg">
                <span class="icon">✨</span>
                <span>Generate Vocabulary</span>
              </button>
            </div>
          </form>
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
    this.container.querySelector('#btn-quick-settings')?.addEventListener('click', () => {
      if (this.onNavigate) this.onNavigate('settings');
    });

    this.container.querySelector('#btn-load-samples')?.addEventListener('click', () => {
      this.handleLoadSampleWords();
    });

    // Sentence count stepper (4-10)
    const updateSentenceCountLabel = () => {
      const label = this.container.querySelector('#sentence-count-label');
      if (label) label.textContent = String(this.sentenceCount);
    };

    this.container.querySelector('#btn-sentence-decrement')?.addEventListener('click', () => {
      this.sentenceCount = Math.max(4, this.sentenceCount - 1);
      updateSentenceCountLabel();
    });

    this.container.querySelector('#btn-sentence-increment')?.addEventListener('click', () => {
      this.sentenceCount = Math.min(10, this.sentenceCount + 1);
      updateSentenceCountLabel();
    });

    // Word generation form submit
    this.container.querySelector('#form-words')?.addEventListener('submit', (e) => {
      this.handleGenerateSubmit(e);
    });
  }
}

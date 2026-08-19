/**
 * Settings View Component
 * API Keys, TTS Voice Configuration, Session Settings, Data Backup/Export.
 */

import { StorageService } from '../services/storage.js';
import { OpenAIService } from '../services/openai.js';
import { GeminiService } from '../services/gemini.js';
import { audioDb } from '../services/db.js';
import { SAMPLE_WORDS } from '../data/sample-words.js';
import { escapeHtml } from '../utils/html.js';

export class SettingsView {
  constructor(container, onNavigate, onThemeChange) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.onThemeChange = onThemeChange;
    this.settings = StorageService.getSettings();
    this.testAudio = null;
  }

  init() {
    this.settings = StorageService.getSettings();
    this.render();
  }

  destroy() {
    if (this.testAudio) {
      this.testAudio.pause();
      this.testAudio = null;
    }
  }

  async testOpenAI() {
    const statusElem = this.container.querySelector('#status-openai-test');
    if (!statusElem) return;

    statusElem.innerHTML = `<span class="spinner-sm"></span> Testing connection...`;
    statusElem.className = 'status-msg status-loading';

    const apiKey = this.container.querySelector('#input-openai-key')?.value.trim();
    const model = this.container.querySelector('#input-openai-model')?.value.trim();
    const baseUrl = this.container.querySelector('#input-openai-baseurl')?.value.trim();

    try {
      await OpenAIService.testConnection(apiKey, model, baseUrl);
      statusElem.innerHTML = `✓ Connection to OpenAI (${escapeHtml(model)}) successful!`;
      statusElem.className = 'status-msg status-success';
    } catch (e) {
      statusElem.innerHTML = `✕ Error: ${escapeHtml(e.message)}`;
      statusElem.className = 'status-msg status-error';
    }
  }

  async testGemini() {
    const statusElem = this.container.querySelector('#status-gemini-test');
    if (!statusElem) return;

    statusElem.innerHTML = `<span class="spinner-sm"></span> Generating test audio via Gemini TTS...`;
    statusElem.className = 'status-msg status-loading';

    const apiKey = this.container.querySelector('#input-gemini-key')?.value.trim();
    const model = this.container.querySelector('#input-gemini-model')?.value.trim();
    const voice = this.container.querySelector('#select-gemini-voice')?.value;

    try {
      const audioBlob = await GeminiService.generateSpeechAudio(
        'Herzlich willkommen! Das ist eine Sprachprobe für dein Vokabeltraining.',
        { apiKey, model, voice }
      );

      statusElem.innerHTML = `✓ Audio received! Playing sample...`;
      statusElem.className = 'status-msg status-success';

      const audioUrl = URL.createObjectURL(audioBlob);
      this.testAudio = new Audio(audioUrl);
      this.testAudio.play();
    } catch (e) {
      statusElem.innerHTML = `✕ Error: ${escapeHtml(e.message)}`;
      statusElem.className = 'status-msg status-error';
    }
  }

  saveFormSettings() {
    const updated = {
      ...this.settings,
      openaiApiKey: this.container.querySelector('#input-openai-key')?.value.trim() || '',
      openaiBaseUrl: this.container.querySelector('#input-openai-baseurl')?.value.trim() || '',
      openaiModel: this.container.querySelector('#input-openai-model')?.value.trim() || 'gpt-4o-mini',
      geminiApiKey: this.container.querySelector('#input-gemini-key')?.value.trim() || '',
      geminiModel: this.container.querySelector('#input-gemini-model')?.value.trim() || 'gemini-3.1-flash-tts-preview',
      geminiVoice: this.container.querySelector('#select-gemini-voice')?.value || 'Puck',
      sessionWordCount: parseInt(this.container.querySelector('#input-session-n')?.value, 10) || 5,
      sentencesPerWord: parseInt(this.container.querySelector('#input-sentences-per-word')?.value, 10) || 2,
      defaultPlaybackRate: parseFloat(this.container.querySelector('#select-playback-rate')?.value) || 1.0,
      theme: this.container.querySelector('#select-theme')?.value || 'dark',
      cefrLevel: this.container.querySelector('#select-cefr-level')?.value || 'B1'
    };

    StorageService.saveSettings(updated);
    this.settings = updated;

    if (this.onThemeChange) {
      this.onThemeChange(updated.theme);
    }

    this.showSavedBanner();
  }

  showSavedBanner() {
    const banner = this.container.querySelector('#save-status-banner');
    if (banner) {
      banner.style.display = 'block';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 3000);
    }
  }

  handleExport() {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vtl_vocabulary_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = StorageService.importBackup(content);
        if (res.success) {
          alert(`Successfully imported ${res.count} words!`);
          if (this.onNavigate) this.onNavigate('vocab');
        } else {
          alert(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
  }

  async handleClearAudioCache() {
    if (confirm('Do you want to clear all cached audio blobs from IndexedDB? (They will be re-synthesized when needed).')) {
      await audioDb.clearAll();
      alert('Audio cache cleared.');
      this.render();
    }
  }

  handleResetSampleWords() {
    if (confirm('Warning: This will overwrite your current vocabulary with the default B1 sample words. Continue?')) {
      StorageService.saveWords(SAMPLE_WORDS);
      alert('Default starter vocabulary restored!');
      if (this.onNavigate) this.onNavigate('practice');
    }
  }

  async render() {
    let audioCacheCount = 0;
    try {
      audioCacheCount = await audioDb.countAudio();
    } catch (e) {
      console.warn(e);
    }

    let html = `
      <div class="settings-wrapper">
        <div class="settings-header">
          <h2>Settings</h2>
          <p class="settings-subtitle">Configure your API keys, TTS audio voices, and spaced repetition practice parameters.</p>
        </div>

        <div id="save-status-banner" class="alert-banner alert-success" style="display: none;">
          ✓ Settings successfully saved!
        </div>

        <!-- OpenAI Config -->
        <div class="card settings-card">
          <div class="card-header-icon">
            <span class="sec-icon">🤖</span>
            <div>
              <h3>OpenAI API (Text & Example Sentences)</h3>
              <p class="card-sub">Used for linguistic analysis and generating 5-10 contextual example sentences per word (count and CEFR level chosen when adding words).</p>
            </div>
          </div>

          <div class="form-group">
            <label for="input-openai-key">OpenAI API Key:</label>
            <div class="input-password-wrap">
              <input 
                type="password" 
                id="input-openai-key" 
                class="input-text" 
                placeholder="sk-proj-..."
                value="${escapeHtml(this.settings.openaiApiKey)}"
              />
              <button type="button" class="btn-toggle-pw" data-target="input-openai-key">👁️</button>
            </div>
            <small class="form-hint">Stored strictly locally in your browser (localStorage).</small>
          </div>

          <div class="grid-2col">
            <div class="form-group">
              <label for="input-openai-baseurl">OpenAI Base URL (Optional):</label>
              <input 
                type="text" 
                id="input-openai-baseurl"
                class="input-text"
                value="${escapeHtml(this.settings.openaiBaseUrl)}"
                placeholder="https://api.openai.com/v1"
              />
              <small class="form-hint">Default: <code>https://api.openai.com/v1</code>. Supports OpenRouter, Groq, Ollama, etc.</small>
            </div>

            <div class="form-group">
              <label for="input-openai-model">Model:</label>
              <input 
                type="text" 
                id="input-openai-model"
                class="input-text"
                value="${escapeHtml(this.settings.openaiModel || 'gpt-4o-mini')}"
                placeholder="gpt-4o-mini, gpt-4o, etc."
              />
              <small class="form-hint">Recommended: <code>gpt-4o-mini</code>.</small>
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-secondary btn-sm" id="btn-test-openai">
              <span>🔌 Test OpenAI Connection</span>
            </button>
            <div id="status-openai-test" class="status-msg"></div>
          </div>
        </div>

        <!-- Gemini Config -->
        <div class="card settings-card">
          <div class="card-header-icon">
            <span class="sec-icon">🎙️</span>
            <div>
              <h3>Gemini API (TTS Audio Output)</h3>
              <p class="card-sub">Generates natural, clear, slightly slow German pronunciation for example sentences.</p>
            </div>
          </div>

          <div class="form-group">
            <label for="input-gemini-key">Gemini API Key:</label>
            <div class="input-password-wrap">
              <input 
                type="password" 
                id="input-gemini-key" 
                class="input-text" 
                placeholder="AIzaSy..."
                value="${escapeHtml(this.settings.geminiApiKey)}"
              />
              <button type="button" class="btn-toggle-pw" data-target="input-gemini-key">👁️</button>
            </div>
            <small class="form-hint">Get a free key from Google AI Studio.</small>
          </div>

          <div class="grid-2col">
            <div class="form-group">
              <label for="input-gemini-model">TTS Model:</label>
              <input 
                type="text" 
                id="input-gemini-model"
                class="input-text"
                value="${escapeHtml(this.settings.geminiModel || 'gemini-3.1-flash-tts-preview')}"
                placeholder="gemini-3.1-flash-tts-preview"
              />
              <small class="form-hint">E.g. <code>gemini-3.1-flash-tts-preview</code> or <code>gemini-2.5-flash</code></small>
            </div>

            <div class="form-group">
              <label for="select-gemini-voice">Gemini TTS Voice:</label>
              <select id="select-gemini-voice" class="select-text">
                <option value="Puck" ${this.settings.geminiVoice === 'Puck' ? 'selected' : ''}>Puck (Clear, lively)</option>
                <option value="Charon" ${this.settings.geminiVoice === 'Charon' ? 'selected' : ''}>Charon (Calm, deep)</option>
                <option value="Kore" ${this.settings.geminiVoice === 'Kore' ? 'selected' : ''}>Kore (Gentle, soft)</option>
                <option value="Fenrir" ${this.settings.geminiVoice === 'Fenrir' ? 'selected' : ''}>Fenrir (Strong)</option>
                <option value="Aoede" ${this.settings.geminiVoice === 'Aoede' ? 'selected' : ''}>Aoede (Melodic)</option>
              </select>
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-secondary btn-sm" id="btn-test-gemini">
              <span>🔊 Listen to Gemini TTS Sample</span>
            </button>
            <div id="status-gemini-test" class="status-msg"></div>
          </div>
        </div>

        <!-- Session & Learning Parameters -->
        <div class="card settings-card">
          <div class="card-header-icon">
            <span class="sec-icon">⚙️</span>
            <div>
              <h3>Practice Parameters & Spaced Repetition</h3>
              <p class="card-sub">Set session word count, sentences per card, and default audio playback speed.</p>
            </div>
          </div>

          <div class="form-group">
            <label for="select-cefr-level">Target CEFR Level (for newly generated words):</label>
            <select id="select-cefr-level" class="select-text">
              ${['A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => `
                <option value="${lvl}" ${(this.settings.cefrLevel || 'B1') === lvl ? 'selected' : ''}>${lvl}</option>
              `).join('')}
            </select>
            <small class="form-hint">Guides sentence/word difficulty when generating new vocabulary via OpenAI.</small>
          </div>

          <div class="grid-3col">
            <div class="form-group">
              <label for="input-session-n">Words per Session (N):</label>
              <input 
                type="number" 
                id="input-session-n" 
                class="input-text" 
                min="1" 
                max="20" 
                value="${this.settings.sessionWordCount || 5}"
              />
              <small class="form-hint">Default: 5 (A-Res weighted)</small>
            </div>

            <div class="form-group">
              <label for="input-sentences-per-word">Sentences per Word:</label>
              <input 
                type="number" 
                id="input-sentences-per-word" 
                class="input-text" 
                min="1" 
                max="5" 
                value="${this.settings.sentencesPerWord || 2}"
              />
              <small class="form-hint">Default: 2, picked from each word's generated sentence pool (5-10 sentences)</small>
            </div>

            <div class="form-group">
              <label for="select-playback-rate">Audio Playback Speed:</label>
              <select id="select-playback-rate" class="select-text">
                <option value="1.0" ${this.settings.defaultPlaybackRate === 1.0 ? 'selected' : ''}>1.0x (Natural / Original Quality)</option>
                <option value="0.85" ${this.settings.defaultPlaybackRate === 0.85 ? 'selected' : ''}>0.85x (Slowed by browser)</option>
                <option value="0.75" ${this.settings.defaultPlaybackRate === 0.75 ? 'selected' : ''}>0.75x (Slower)</option>
              </select>
            </div>
          </div>

          <div class="grid-2col">
            <div class="form-group">
              <label for="select-theme">Color Theme:</label>
              <select id="select-theme" class="select-text">
                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark Theme</option>
                <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light Theme</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-save-bar">
          <button class="btn btn-primary btn-lg" id="btn-save-all-settings">
            <span>💾 Save All Settings</span>
          </button>
        </div>

        <!-- Storage & Backups -->
        <div class="card settings-card">
          <div class="card-header-icon">
            <span class="sec-icon">💾</span>
            <div>
              <h3>Storage & Data Management</h3>
              <p class="card-sub">
                Words & Metadata: <strong>localStorage</strong> | 
                Audio Files: <strong>IndexedDB</strong> (${audioCacheCount} blobs cached)
              </p>
            </div>
          </div>

          <div class="storage-buttons-grid">
            <button class="btn btn-secondary" id="btn-export-backup">
              <span>📤 Export Backup (JSON)</span>
            </button>

            <label class="btn btn-secondary btn-file-label">
              <span>📥 Import Backup</span>
              <input type="file" id="input-import-file" accept=".json" style="display: none;" />
            </label>

            <button class="btn btn-secondary" id="btn-clear-audio-cache">
              <span>🧹 Clear Audio Cache</span>
            </button>

            <button class="btn btn-danger" id="btn-reset-samples">
              <span>🔄 Reset to Starter Vocabulary</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Password toggle
    this.container.querySelectorAll('.btn-toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = this.container.querySelector(`#${targetId}`);
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
    });

    // Test buttons
    this.container.querySelector('#btn-test-openai')?.addEventListener('click', () => {
      this.testOpenAI();
    });

    this.container.querySelector('#btn-test-gemini')?.addEventListener('click', () => {
      this.testGemini();
    });

    // Save settings
    this.container.querySelector('#btn-save-all-settings')?.addEventListener('click', () => {
      this.saveFormSettings();
    });

    // Backup & restore
    this.container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      this.handleExport();
    });

    this.container.querySelector('#input-import-file')?.addEventListener('change', (e) => {
      this.handleImport(e);
    });

    this.container.querySelector('#btn-clear-audio-cache')?.addEventListener('click', () => {
      this.handleClearAudioCache();
    });

    this.container.querySelector('#btn-reset-samples')?.addEventListener('click', () => {
      this.handleResetSampleWords();
    });
  }
}

/**
 * Main Application Entry Point
 * Routing, View Management, Keyboard Shortcuts, Theme Handling
 */

import { StorageService } from './services/storage.js';
import { audioDb } from './services/db.js';
import { audioPlayer } from './services/audio-player.js';
import { SAMPLE_WORDS } from './data/sample-words.js';

import { PracticeView } from './ui/practice-view.js';
import { VocabView } from './ui/vocab-view.js';
import { AddView } from './ui/add-view.js';
import { SettingsView } from './ui/settings-view.js';

class App {
  constructor() {
    this.currentView = null;
    this.currentTab = 'practice';
    this.container = document.getElementById('view-container');
  }

  async init() {
    // 1. Initialize IndexedDB
    try {
      await audioDb.init();
    } catch (e) {
      console.error('IndexedDB initialization failed:', e);
    }

    // 2. Initialize default sample words if storage is empty
    const words = StorageService.getWords();
    if (!words || words.length === 0) {
      StorageService.saveWords(SAMPLE_WORDS);
    }

    // 3. Apply settings (Theme, audio rate)
    const settings = StorageService.getSettings();
    this.applyTheme(settings.theme || 'dark');
    audioPlayer.setPlaybackRate(settings.defaultPlaybackRate || 0.85);

    // 4. Bind Global Navigation & Shortcuts
    this.bindGlobalEvents();

    // 5. Mount Initial View
    this.navigateTo('practice');
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);

    const settings = StorageService.getSettings();
    settings.theme = next;
    StorageService.saveSettings(settings);
  }

  navigateTo(tab) {
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }

    this.currentTab = tab;

    // Update nav button states
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Mount view
    switch (tab) {
      case 'practice':
        this.currentView = new PracticeView(this.container, (t) => this.navigateTo(t));
        break;
      case 'vocab':
        this.currentView = new VocabView(this.container, (t) => this.navigateTo(t));
        break;
      case 'add':
        this.currentView = new AddView(this.container, (t) => this.navigateTo(t));
        break;
      case 'settings':
        this.currentView = new SettingsView(
          this.container, 
          (t) => this.navigateTo(t),
          (theme) => this.applyTheme(theme)
        );
        break;
      default:
        this.currentView = new PracticeView(this.container, (t) => this.navigateTo(t));
    }

    if (this.currentView && typeof this.currentView.init === 'function') {
      this.currentView.init();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindGlobalEvents() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.navigateTo(tab);
      });
    });

    // Brand logo returns to practice
    document.querySelector('.brand-logo')?.addEventListener('click', () => {
      this.navigateTo('practice');
    });

    // Theme toggle button
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore shortcut keys if typing in an input, textarea, or select
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (this.currentTab === 'practice' && this.currentView) {
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          this.currentView.refreshSession();
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          this.currentView.toggleAllMeanings();
        } else if (e.key >= '1' && e.key <= '9') {
          const index = parseInt(e.key, 10) - 1;
          const word = this.currentView.sessionWords[index];
          if (word) {
            e.preventDefault();
            this.currentView.toggleWordMeaning(word.id);
          }
        }
      }
    });
  }
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

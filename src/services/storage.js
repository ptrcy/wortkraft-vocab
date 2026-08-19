/**
 * LocalStorage Service for Vocabulary, Settings & Mastery
 */

const STORAGE_KEYS = {
  WORDS: 'vtl_words_v1',
  SETTINGS: 'vtl_settings_v1',
  STATS: 'vtl_stats_v1'
};

export const DEFAULT_SETTINGS = {
  openaiApiKey: '',
  openaiBaseUrl: '', // defaults to https://api.openai.com/v1 if empty
  openaiModel: 'gpt-4o-mini',
  geminiApiKey: '',
  geminiModel: 'gemini-3.1-flash-tts-preview', // or gemini-2.5-flash
  geminiVoice: 'Puck', // Puck, Charon, Kore, Fenrir, Aoede
  sessionWordCount: 5,
  sentencesPerWord: 2,
  defaultPlaybackRate: 1.0, // 1.0 preserves original audio quality without browser stretching
  theme: 'dark',
  autoPlayAudio: false,
  cefrLevel: 'B1',
  audioWorkers: 2 // concurrent Gemini TTS requests during word generation
};

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class StorageService {
  // --- SETTINGS ---
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }

  // --- WORDS ---
  static getWords() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load words:', e);
      return [];
    }
  }

  static saveWords(words) {
    try {
      localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
      return true;
    } catch (e) {
      console.error('Failed to save words:', e);
      return false;
    }
  }

  static getWordById(id) {
    const words = this.getWords();
    return words.find(w => w.id === id) || null;
  }

  static addWord(word) {
    const words = this.getWords();
    // Check for duplicate by normalized word
    const key = (word.normalizedWord || '').toLowerCase();
    const existingIndex = words.findIndex(
      w => (w.normalizedWord || '').toLowerCase() === key
    );

    if (existingIndex >= 0) {
      words[existingIndex] = { ...words[existingIndex], ...word };
    } else {
      words.unshift(word);
    }
    this.saveWords(words);
    return word;
  }

  static addMultipleWords(newWords) {
    const words = this.getWords();
    const map = new Map(words.map(w => [(w.normalizedWord || '').toLowerCase(), w]));
    for (const nw of newWords) {
      const key = (nw.normalizedWord || '').toLowerCase();
      map.set(key, { ...(map.get(key) || {}), ...nw });
    }
    const updated = Array.from(map.values());
    this.saveWords(updated);
    return updated;
  }

  static updateWord(id, updates) {
    const words = this.getWords();
    const index = words.findIndex(w => w.id === id);
    if (index >= 0) {
      words[index] = { ...words[index], ...updates };
      this.saveWords(words);
      return words[index];
    }
    return null;
  }

  static deleteWord(id) {
    const words = this.getWords();
    const filtered = words.filter(w => w.id !== id);
    this.saveWords(filtered);
    return filtered;
  }

  /**
   * Mark word as learned for today
   * Raises masteryLevel by 1 if not already marked today.
   */
  static markWordLearned(id) {
    const words = this.getWords();
    const word = words.find(w => w.id === id);
    if (!word) return { success: false, error: 'Word not found' };

    const today = getTodayDateString();
    if (word.lastLearnedDate === today) {
      return {
        success: false,
        alreadyLearnedToday: true,
        word
      };
    }

    word.masteryLevel = (word.masteryLevel || 0) + 1;
    word.lastLearnedDate = today;
    this.saveWords(words);

    return {
      success: true,
      alreadyLearnedToday: false,
      word
    };
  }

  /**
   * Reset or set mastery level manually
   */
  static setMasteryLevel(id, level) {
    const words = this.getWords();
    const word = words.find(w => w.id === id);
    if (!word) return null;
    word.masteryLevel = Math.max(0, parseInt(level, 10) || 0);
    this.saveWords(words);
    return word;
  }

  // --- STATS & EXPORT ---
  static getStats() {
    const words = this.getWords();
    const today = getTodayDateString();
    const learnedToday = words.filter(w => w.lastLearnedDate === today).length;
    const masteredCount = words.filter(w => (w.masteryLevel || 0) >= 4).length;
    const inProgressCount = words.filter(w => (w.masteryLevel || 0) > 0 && (w.masteryLevel || 0) < 4).length;
    const newCount = words.filter(w => (w.masteryLevel || 0) === 0).length;

    return {
      total: words.length,
      learnedToday,
      masteredCount,
      inProgressCount,
      newCount
    };
  }

  static exportBackup() {
    const words = this.getWords();
    const settings = this.getSettings();
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      words,
      settings: {
        ...settings,
        openaiApiKey: '', // Don't export secrets
        geminiApiKey: ''
      }
    }, null, 2);
  }

  static importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.words)) {
        this.saveWords(data.words);
      }
      return { success: true, count: data.words?.length || 0 };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }
}

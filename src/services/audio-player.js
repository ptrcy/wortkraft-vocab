/**
 * Audio Player Engine
 * Manages audio playback from IndexedDB blobs, on-demand Gemini generation, or Web Speech fallback.
 */

import { audioDb } from './db.js';
import { GeminiService } from './gemini.js';
import { StorageService } from './storage.js';

class AudioPlayerEngine {
  constructor() {
    this.currentAudio = null;
    this.currentSentenceId = null;
    this.currentObjectUrl = null;
    this.playbackRate = 1.0;
    this.listeners = new Set();
    this.loadingIds = new Set();

    // Fallback synth
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
  }

  setPlaybackRate(rate) {
    this.playbackRate = parseFloat(rate) || 0.85;
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.playbackRate;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(state) {
    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (e) {
        console.error(e);
      }
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    const prevId = this.currentSentenceId;
    this.currentSentenceId = null;
    if (prevId) {
      this.notify({ type: 'stop', sentenceId: prevId });
    }
  }

  async playSentence(sentenceId, germanText) {
    // If clicking on the currently playing sentence, toggle pause/stop
    if (this.currentSentenceId === sentenceId && (this.currentAudio && !this.currentAudio.paused || (this.synth && this.synth.speaking))) {
      this.stop();
      return;
    }

    this.stop();
    this.currentSentenceId = sentenceId;

    try {
      // 1. Try to get cached blob from IndexedDB
      let blob = await audioDb.getAudio(sentenceId);

      // 2. If not found in IndexedDB, try generating via Gemini if API key present
      if (!blob) {
        const settings = StorageService.getSettings();
        if (settings.geminiApiKey) {
          this.loadingIds.add(sentenceId);
          this.notify({ type: 'loading', sentenceId, isLoading: true });

          try {
            blob = await GeminiService.generateSpeechAudio(germanText, {
              apiKey: settings.geminiApiKey,
              model: settings.geminiModel || 'gemini-2.0-flash',
              voice: settings.geminiVoice || 'Puck'
            });
            // Cache to IndexedDB for instant future playback
            await audioDb.saveAudio(sentenceId, blob);
          } catch (genErr) {
            console.warn('Gemini TTS generation failed, falling back to Web Speech API:', genErr);
          } finally {
            this.loadingIds.delete(sentenceId);
            this.notify({ type: 'loading', sentenceId, isLoading: false });
          }
        }
      }

      // 3. Play audio blob if available
      if (blob) {
        this.currentObjectUrl = URL.createObjectURL(blob);
        const audio = new Audio(this.currentObjectUrl);
        this.currentAudio = audio;
        audio.playbackRate = this.playbackRate;

        audio.onplay = () => {
          this.notify({ type: 'play', sentenceId, isFallback: false });
        };

        audio.onended = () => {
          this.stop();
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          this.stop();
          this.playFallbackWebSpeech(sentenceId, germanText);
        };

        await audio.play();
        return;
      }

      // 4. Fallback to browser SpeechSynthesis
      this.playFallbackWebSpeech(sentenceId, germanText);

    } catch (err) {
      console.error('Failed to play sentence audio:', err);
      this.loadingIds.delete(sentenceId);
      this.notify({ type: 'loading', sentenceId, isLoading: false });
      this.playFallbackWebSpeech(sentenceId, germanText);
    }
  }

  playFallbackWebSpeech(sentenceId, text) {
    if (!this.synth) {
      console.error('Speech synthesis not supported in this browser');
      this.stop();
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = Math.max(0.6, this.playbackRate * 0.95);

    // Try finding natural German voice if available
    const voices = this.synth.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('German')));
    if (deVoice) {
      utterance.voice = deVoice;
    }

    utterance.onstart = () => {
      this.notify({ type: 'play', sentenceId, isFallback: true });
    };

    utterance.onend = () => {
      this.stop();
    };

    utterance.onerror = () => {
      this.stop();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  isPlaying(sentenceId) {
    return this.currentSentenceId === sentenceId;
  }

  isLoading(sentenceId) {
    return this.loadingIds.has(sentenceId);
  }
}

export const audioPlayer = new AudioPlayerEngine();

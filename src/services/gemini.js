/**
 * Gemini Service for TTS Audio Generation
 * Produces clear, slightly slow German audio for vocabulary sentences
 */

export class GeminiService {
  /**
   * Test Gemini API Connection
   */
  static async testConnection(apiKey, model = 'gemini-3.1-flash-tts-preview') {
    if (!apiKey) throw new Error('Gemini API key is empty');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Respond with the single word "OK"' }]
        }],
        generationConfig: {
          maxOutputTokens: 5
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return true;
  }

  /**
   * Generate German Speech Audio for a sentence via Gemini
   * @param {string} germanSentence 
   * @param {object} options - { apiKey, model, voice }
   * @returns {Promise<Blob>}
   */
  static async generateSpeechAudio(germanSentence, { apiKey, model = 'gemini-3.1-flash-tts-preview', voice = 'Puck' }) {
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please set it in Settings.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = `TTS the following text in German.

Read ONLY the German text below. Do not add any introductory, greeting, or concluding words. Do not explain anything.

Speak naturally, clearly, with authentic German pronunciation, intonation, and rhythm at a calm, comfortable pace for learners.

Text:
${germanSentence.trim()}`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice || 'Puck'
            }
          }
        }
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini TTS HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const candidate = json.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error('No audio data received in Gemini response');
    }

    const { data: base64Data, mimeType } = audioPart.inlineData;
    return this.convertBase64ToBlob(base64Data, mimeType);
  }

  /**
   * Converts base64 audio response (including raw PCM) to playable audio Blob
   */
  static convertBase64ToBlob(base64Data, mimeType = 'audio/wav') {
    // Sanitize base64 string
    const sanitizedBase64 = base64Data.replace(/[\r\n\s]+/g, '');
    const binaryStr = atob(sanitizedBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Check if raw PCM (e.g. audio/pcm;rate=24000 or audio/L16 or generic audio/wav)
    if (!mimeType || mimeType.includes('pcm') || mimeType.includes('L16') || (!mimeType.includes('mp3') && !mimeType.includes('ogg') && !mimeType.includes('aac'))) {
      // Extract sample rate if present, default to 24000
      let sampleRate = 24000;
      const rateMatch = (mimeType || '').match(/rate=(\d+)/);
      if (rateMatch && rateMatch[1]) {
        sampleRate = parseInt(rateMatch[1], 10);
      }
      return this.pcmToWavBlob(bytes, sampleRate, 1, 16);
    }

    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Wraps raw 16-bit PCM samples into standard RIFF WAV Blob
   * Exact equivalent of Python's wave.open(..., "wb") with channels=1, rate=24000, sample_width=2
   */
  static pcmToWavBlob(pcmBytes, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
    // Align to 16-bit (2 bytes per sample)
    const dataSize = pcmBytes.length - (pcmBytes.length % 2);
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);             // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);              // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);    // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true);     // SampleRate (24000)
    view.setUint32(28, byteRate, true);       // ByteRate (48000)
    view.setUint16(32, blockAlign, true);     // BlockAlign (2)
    view.setUint16(34, bitsPerSample, true);  // BitsPerSample (16)

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);       // Subchunk2Size

    // Write PCM sample bytes
    const outBytes = new Uint8Array(buffer, headerSize, dataSize);
    outBytes.set(pcmBytes.subarray(0, dataSize));

    return new Blob([buffer], { type: 'audio/wav' });
  }

  static writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

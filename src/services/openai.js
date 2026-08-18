/**
 * OpenAI Service for Generating German Vocabulary Sentences & Explanations
 */

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'https://api.openai.com/v1';
  }
  return url.trim().replace(/\/+$/, '');
}

export class OpenAIService {
  /**
   * Test OpenAI API Key / Connection
   */
  static async testConnection(apiKey, model = 'gpt-4o-mini', baseUrl = '') {
    if (!apiKey) throw new Error('API key is empty');

    const base = normalizeBaseUrl(baseUrl);
    const endpoint = `${base}/chat/completions`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return true;
  }

  /**
   * Generate ~10 B1 sentences and concise explanation for a German word/expression
   * @param {string} rawInput - e.g. "Sehnsucht" or "verabreden" or "der Feierabend"
   * @param {object} options - { apiKey, model, baseUrl }
   */
  static async generateWordData(rawInput, { apiKey, model = 'gpt-4o-mini', baseUrl = '' }) {
    if (!apiKey) {
      throw new Error('OpenAI API key is missing. Please set it in Settings.');
    }

    const base = normalizeBaseUrl(baseUrl);
    const endpoint = `${base}/chat/completions`;

    const trimmedInput = rawInput.trim();
    const firstChar = trimmedInput.charAt(0);
    const initialPosHint = firstChar === firstChar.toUpperCase() && isNaN(firstChar) ? 'noun' : 'verb/other';

    const systemPrompt = `You are an expert German language tutor creating vocabulary learning material for language learners.
Your task is to analyze the given German word or expression, extract its grammatical details, write a concise explanation, and create exactly 10 SIMPLE, contextual German sentences.

CRITICAL REQUIREMENT — SENTENCE SIMPLICITY & ACCESSIBILITY:
1. Sentence Length: Keep sentences SHORT to MEDIUM (approx 7–14 words).
2. Vocabulary Level: Use SIMPLE, high-frequency, everyday words (A1–A2 level) for all words EXCEPT the target word.
3. Clarity: The target word/expression must be the ONLY challenging word in the sentence. Avoid literary words, obscure nouns, or convoluted subordinate clauses.
4. Contextual Clues: Make the situation everyday and crystal clear (e.g., meeting friends, eating, work, weekend, weather, home, feelings) so the learner can easily deduce the target word's meaning from context.
5. Inflection: Highlight the target word in natural, everyday forms (e.g., present, simple past, or perfect).

SPECIFICATIONS:
1. Part of speech: The user entered "${trimmedInput}". The initial guess based on casing is "${initialPosHint}", but you MUST determine the TRUE accurate part of speech and gender/article.
2. Sentences:
   - Provide EXACTLY 10 distinct, simple, everyday German sentences.
   - For each sentence, provide a clear English translation/hint.
3. Explanation:
   - Concise and high-yield.
   - Meaning: Clear, direct English translation.
   - Part of speech: E.g., "Substantiv (f)", "Verb (unregelmäßig, trennbar)", "Adjektiv", "Redewendung".
   - Article: "der", "die", "das" (if noun) or null.
   - Plural form: E.g., "die Häuser" (if noun) or null.
   - Verb forms: E.g., "ging, ist gegangen" / "sah, hat gesehen" (if verb) or null.
   - Governing prepositions: E.g., "warten auf + Akk.", "sich freuen über + Akk. / auf + Akk." or null.
   - Fixed expressions: Array of 1-3 useful everyday collocations or idioms (with English translation).
   - Memory hook: A brief, clever mnemonic, etymology connection, or pronunciation trick linking to the meaning.

RESPONSE FORMAT:
You MUST respond with pure JSON conforming to this exact schema:
{
  "normalizedWord": "die Sehnsucht",
  "article": "die",
  "partOfSpeech": "Substantiv (f)",
  "meaning": "longing, yearning, intense desire",
  "plural": "die Sehnsüchte",
  "verbForms": null,
  "governingPrepositions": "Sehnsucht nach + Dat.",
  "fixedExpressions": [
    "Sehnsucht haben nach (to have a longing for)",
    "vor Sehnsucht vergehen (to perish with yearning)"
  ],
  "memoryHook": "Combines 'sehnen' (to yearn) and 'Sucht' (addiction/craving) -> an addiction-like yearning.",
  "sentences": [
    { "id": "s1", "german": "Wenn er im Winter die alten Urlaubsfotos ansieht, spürt er eine tiefe Sehnsucht nach Sonne und Meer.", "englishHint": "When he looks at old vacation photos in winter, he feels a deep longing for sun and sea." },
    ... exactly 10 sentences with IDs s1 to s10 ...
  ]
}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Target German expression: "${trimmedInput}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from OpenAI');

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse OpenAI JSON response: ' + e.message);
    }

    // Generate unique sentence IDs
    const wordId = 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const formattedSentences = (parsed.sentences || []).map((s, idx) => ({
      id: `${wordId}_s${idx + 1}`,
      german: s.german,
      englishHint: s.englishHint || s.english || ''
    }));

    return {
      id: wordId,
      rawInput: trimmedInput,
      normalizedWord: parsed.normalizedWord || trimmedInput,
      article: parsed.article || null,
      partOfSpeech: parsed.partOfSpeech || (initialPosHint === 'noun' ? 'Substantiv' : 'Verb'),
      meaning: parsed.meaning || '',
      plural: parsed.plural || null,
      verbForms: parsed.verbForms || null,
      governingPrepositions: parsed.governingPrepositions || null,
      fixedExpressions: Array.isArray(parsed.fixedExpressions) ? parsed.fixedExpressions : [],
      memoryHook: parsed.memoryHook || '',
      masteryLevel: 0,
      lastLearnedDate: null,
      createdAt: Date.now(),
      sentences: formattedSentences
    };
  }
}

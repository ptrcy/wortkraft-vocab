/**
 * Weighted Sampling Service using A-Res (Algorithm R with Exponential Jumps)
 * 
 * Spec:
 * - Each word has a masteryLevel (starts at 0).
 * - weight = 0.4 ^ masteryLevel, floored at 0.02
 * - Pick N via weighted sampling without replacement: key = random ^ (1/weight), take top N.
 */

export function calculateWordWeight(masteryLevel = 0) {
  const level = Math.max(0, parseInt(masteryLevel, 10) || 0);
  const rawWeight = Math.pow(0.4, level);
  return Math.max(0.02, rawWeight);
}

/**
 * A-Res weighted sampling without replacement
 * @param {Array} words - Array of word objects
 * @param {number} n - Number of items to sample
 * @returns {Array} - Top N sampled words
 */
export function sampleWordsARes(words, n = 5) {
  if (!words || words.length === 0) return [];
  if (words.length <= n) {
    // Shuffle array if fewer than or equal to n
    return [...words].sort(() => Math.random() - 0.5);
  }

  // Calculate A-Res key for each word: key = random ^ (1 / weight)
  const scored = words.map(word => {
    const weight = calculateWordWeight(word.masteryLevel);
    // Ensure random number is in (0, 1] to avoid Math.pow(0, ...) issues
    const rand = Math.max(1e-10, Math.random());
    const key = Math.pow(rand, 1 / weight);
    return {
      word,
      weight,
      key
    };
  });

  // Sort descending by key
  scored.sort((a, b) => b.key - a.key);

  // Take top N
  return scored.slice(0, n).map(item => item.word);
}

/**
 * Pick k random distinct sentences from a word's sentence pool
 * @param {Array} sentences - Pool of sentences
 * @param {number} count - Number of sentences to pick (default 2)
 * @returns {Array}
 */
export function pickRandomSentences(sentences, count = 2) {
  if (!sentences || sentences.length === 0) return [];
  if (sentences.length <= count) return [...sentences];

  const shuffled = [...sentences].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Prepare a practice session
 * Selects N words using A-Res, and for each word picks `sentencesPerWord` sentences.
 */
export function createPracticeSession(allWords, sessionCount = 5, sentencesPerWord = 2) {
  const selectedWords = sampleWordsARes(allWords, sessionCount);

  return selectedWords.map(word => {
    const chosenSentences = pickRandomSentences(word.sentences || [], sentencesPerWord);
    return {
      ...word,
      activeSentences: chosenSentences,
      revealed: false // user starts with meaning hidden
    };
  });
}

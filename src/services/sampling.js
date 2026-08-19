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
 * Uniform in-place Fisher-Yates shuffle (sort(() => Math.random() - 0.5) is biased).
 */
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
    return shuffle(words);
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
 * Pick k distinct sentences from a word's pool using a "shuffle bag": every
 * sentence is guaranteed to be shown once before any sentence repeats. The
 * draw order (word.sentenceBag) is persisted on the word object so the
 * no-repeat guarantee holds across sessions/days, not just one sitting.
 * Plain random sampling has no memory, so small pools (5-10 sentences)
 * visibly repeat the same sentences far sooner than expected.
 * @param {object} word - Word object (mutated: word.sentenceBag is updated)
 * @param {number} count - Number of sentences to pick (default 2)
 * @returns {Array}
 */
export function pickSentencesNoRepeat(word, count = 2) {
  const pool = word.sentences || [];
  if (pool.length === 0) return [];
  if (pool.length <= count) return [...pool];

  const poolIds = new Set(pool.map(s => s.id));
  let bag = Array.isArray(word.sentenceBag) ? word.sentenceBag.filter(id => poolIds.has(id)) : [];

  if (bag.length < count) {
    const queued = new Set(bag);
    const remaining = pool.filter(s => !queued.has(s.id));
    bag = [...bag, ...shuffle(remaining).map(s => s.id)];
  }

  const chosenIds = bag.slice(0, count);
  word.sentenceBag = bag.slice(count);

  const byId = new Map(pool.map(s => [s.id, s]));
  return chosenIds.map(id => byId.get(id)).filter(Boolean);
}

/**
 * Prepare a practice session
 * Selects N words using A-Res, and for each word picks `sentencesPerWord` sentences.
 * Mutates word.sentenceBag on the selected words (from allWords) as a side effect;
 * callers should persist allWords afterward (e.g. StorageService.saveWords).
 */
export function createPracticeSession(allWords, sessionCount = 5, sentencesPerWord = 2) {
  const selectedWords = sampleWordsARes(allWords, sessionCount);

  return selectedWords.map(word => {
    const chosenSentences = pickSentencesNoRepeat(word, sentencesPerWord);
    return {
      ...word,
      activeSentences: chosenSentences,
      revealed: false // user starts with meaning hidden
    };
  });
}

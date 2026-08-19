/**
 * Fetch with retry/backoff for transient failures (rate limits, upstream hiccups).
 * Batch word generation makes many sequential API calls; a single 429 shouldn't
 * abort the whole run.
 */
export async function fetchWithRetry(url, options = {}, { retries = 2, baseDelayMs = 600 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

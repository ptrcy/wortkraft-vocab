/**
 * Runs `worker` over `items` with at most `concurrency` in flight at once.
 * Unlike chunking, a finished worker immediately picks up the next item
 * instead of waiting for the rest of its batch.
 */
export async function runWithConcurrency(items, worker, concurrency = 2) {
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: limit }, runNext));
}

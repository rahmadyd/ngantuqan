import "server-only";

/**
 * A short-lived cache for the public catalogue.
 *
 * Every public page is rendered on demand and every render reads the
 * database. Over a network that is three to six round trips per page — in a
 * hosted project in another region, that is most of the time a visitor waits
 * for the first pixel.
 *
 * The catalogue changes when the studio edits it, and not a second before, so
 * a short lifetime plus an explicit invalidation on every admin write is
 * enough. Nothing here caches anything private: the read layer only reads
 * published content.
 *
 * On a serverless runtime each instance keeps its own copy. That is fine —
 * the content is the same everywhere, and the write clears the cache.
 */

const DEFAULT_TTL_SECONDS = 60;

interface Entry {
  value: unknown;
  expiresAt: number;
}

const entries = new Map<string, Entry>();
const pending = new Map<string, Promise<unknown>>();

/**
 * Returns the cached value for a key, or loads it.
 *
 * One load per key at a time: a burst of requests does not turn into a burst
 * of queries.
 */
export async function cached<T>(
  key: string,
  load: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key);

  if (hit && hit.expiresAt > now) return hit.value as T;

  const running = pending.get(key);
  if (running) return running as Promise<T>;

  const promise = load()
    .then((value) => {
      entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return value;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, promise);

  return promise;
}

/**
 * Drops every cached value.
 *
 * Called after an admin write, so the studio sees its own edit immediately
 * instead of waiting for the lifetime to run out.
 */
export function clearContentCache() {
  entries.clear();
}

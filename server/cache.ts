import type { MarketDataService } from '../src/services/marketDataService';

interface CacheOptions {
  quotesTtlMs?: number;
  historyTtlMs?: number;
  now?: () => number;
}

/** Wraps a service with an in-memory TTL cache to stay under upstream rate limits. Errors are never cached. */
export function withCache(inner: MarketDataService, options: CacheOptions = {}): MarketDataService {
  const { quotesTtlMs = 30_000, historyTtlMs = 120_000, now = Date.now } = options;
  const store = new Map<string, { expires: number; value: unknown }>();

  async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
    const hit = store.get(key);
    if (hit && hit.expires > now()) return hit.value as T;
    const value = await load();
    store.set(key, { expires: now() + ttl, value });
    return value;
  }

  const keyOf = (symbols: string[]) => [...symbols].sort().join(',');

  return {
    getQuotes: (symbols) => cached(`q:${keyOf(symbols)}`, quotesTtlMs, () => inner.getQuotes(symbols)),
    getHistory: (symbols, window) =>
      cached(`h:${window}:${keyOf(symbols)}`, historyTtlMs, () => inner.getHistory(symbols, window)),
  };
}

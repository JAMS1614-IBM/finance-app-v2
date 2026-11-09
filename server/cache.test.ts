import { describe, expect, it, vi } from 'vitest';
import type { MarketDataService } from '../src/services/marketDataService';
import { withCache } from './cache';

function counting() {
  const inner: MarketDataService = {
    getQuotes: vi.fn(async (symbols: string[]) => symbols.map((symbol: string) => ({ symbol, price: 1, change: 0, changePercent: 0 }))),
    getHistory: vi.fn(async (symbols: string[]) => symbols.map((symbol: string) => ({ symbol, points: [] }))),
  };
  return inner;
}

describe('withCache', () => {
  it('serves repeated calls from cache until the TTL expires', async () => {
    let clock = 0;
    const inner = counting();
    const cached = withCache(inner, { quotesTtlMs: 1000, now: () => clock });

    await cached.getQuotes(['IBM']);
    await cached.getQuotes(['IBM']);
    expect(inner.getQuotes).toHaveBeenCalledTimes(1);

    clock = 1001;
    await cached.getQuotes(['IBM']);
    expect(inner.getQuotes).toHaveBeenCalledTimes(2);
  });

  it('treats symbol order as the same key but separates windows', async () => {
    const inner = counting();
    const cached = withCache(inner);
    await cached.getHistory(['IBM', 'MSFT'], 'day');
    await cached.getHistory(['MSFT', 'IBM'], 'day');
    expect(inner.getHistory).toHaveBeenCalledTimes(1);
    await cached.getHistory(['IBM', 'MSFT'], '7d');
    expect(inner.getHistory).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const getQuotes = vi
      .fn<MarketDataService['getQuotes']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);
    const cached = withCache({ ...counting(), getQuotes });
    await expect(cached.getQuotes(['IBM'])).rejects.toThrow('boom');
    await expect(cached.getQuotes(['IBM'])).resolves.toEqual([]);
    expect(getQuotes).toHaveBeenCalledTimes(2);
  });
});

import { describe, expect, it } from 'vitest';
import { MarketDataError } from './errors';
import { createMockMarketDataService } from './mockMarketDataService';

const service = createMockMarketDataService(() => 1_700_000_000_000);

describe('mock market data service', () => {
  it('returns one quote per symbol', async () => {
    const quotes = await service.getQuotes(['IBM', 'MSFT']);
    expect(quotes.map((q) => q.symbol)).toEqual(['IBM', 'MSFT']);
    expect(quotes[0].price).toBeGreaterThan(0);
  });

  it('is deterministic for the same inputs', async () => {
    expect(await service.getHistory(['IBM'], '7d')).toEqual(await service.getHistory(['IBM'], '7d'));
  });

  it('returns history for each window, ordered by time', async () => {
    for (const window of ['day', '7d', 'quarter'] as const) {
      const [series] = await service.getHistory(['IBM'], window);
      const times = series.points.map((p) => p.t);
      expect(times.length).toBeGreaterThan(1);
      expect([...times].sort((a, b) => a - b)).toEqual(times);
    }
  });

  it('rejects invalid symbols with a typed error', async () => {
    await expect(service.getQuotes(['not a symbol'])).rejects.toMatchObject({
      name: 'MarketDataError',
      code: 'INVALID_SYMBOL',
    });
    await expect(service.getHistory(['123'], 'day')).rejects.toBeInstanceOf(MarketDataError);
  });
});

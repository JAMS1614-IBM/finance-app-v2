import { describe, expect, it, vi } from 'vitest';
import { createYahooMarketDataService, type YahooClient } from './yahooProvider';

const NOW = Date.UTC(2026, 0, 15);

function fakeClient(overrides: Partial<YahooClient> = {}): YahooClient {
  return {
    quote: async (symbols) =>
      symbols.map((symbol) => ({
        symbol,
        regularMarketPrice: 100,
        regularMarketChange: 2,
        regularMarketChangePercent: 2.04,
      })),
    chart: async () => ({
      quotes: [
        { date: new Date(NOW - 2000), close: 10 },
        { date: new Date(NOW - 1000), close: null },
        { date: new Date(NOW), close: 12 },
      ],
    }),
    ...overrides,
  };
}

describe('yahoo provider: quotes', () => {
  it('maps Yahoo fields to domain quotes and skips symbols without a price', async () => {
    const service = createYahooMarketDataService(
      fakeClient({
        quote: async () => [
          { symbol: 'IBM', regularMarketPrice: 244.77, regularMarketChange: -2.34, regularMarketChangePercent: -0.95 },
          { symbol: 'NOPRICE' },
        ],
      }),
    );
    expect(await service.getQuotes(['IBM', 'NOPRICE'])).toEqual([
      { symbol: 'IBM', price: 244.77, change: -2.34, changePercent: -0.95 },
    ]);
  });

  it('reports INVALID_SYMBOL when Yahoo returns nothing usable', async () => {
    const service = createYahooMarketDataService(fakeClient({ quote: async () => [] }));
    await expect(service.getQuotes(['ZZZZ'])).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('wraps upstream failures as UPSTREAM_UNAVAILABLE', async () => {
    const service = createYahooMarketDataService(
      fakeClient({ quote: async () => Promise.reject(new Error('socket hang up')) }),
    );
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });
});

describe('yahoo provider: history', () => {
  it('drops null closes and converts dates to epoch ms', async () => {
    const service = createYahooMarketDataService(fakeClient(), () => NOW);
    expect(await service.getHistory(['IBM'], '7d')).toEqual([
      { symbol: 'IBM', points: [{ t: NOW - 2000, price: 10 }, { t: NOW, price: 12 }] },
    ]);
  });

  it('requests the interval and lookback configured for each window', async () => {
    const chart = vi.fn(async () => ({ quotes: [] }));
    const service = createYahooMarketDataService(fakeClient({ chart }), () => NOW);
    await service.getHistory(['IBM'], 'quarter');
    expect(chart).toHaveBeenCalledWith('IBM', { period1: new Date(NOW - 92 * 86_400_000), interval: '1d' });
  });

  it('survives one failing symbol by returning it as an empty series', async () => {
    const service = createYahooMarketDataService(
      fakeClient({
        chart: async (symbol) => {
          if (symbol === 'BAD') throw new Error('No data found, symbol may be delisted');
          return { quotes: [{ date: new Date(NOW), close: 5 }] };
        },
      }),
      () => NOW,
    );
    const result = await service.getHistory(['IBM', 'BAD'], 'day');
    expect(result.map((s) => [s.symbol, s.points.length])).toEqual([['IBM', 1], ['BAD', 0]]);
  });

  it('throws INVALID_SYMBOL when every symbol is unknown', async () => {
    const service = createYahooMarketDataService(
      fakeClient({ chart: async () => Promise.reject(new Error('No data found, symbol may be delisted')) }),
    );
    await expect(service.getHistory(['ZZZZ'], 'day')).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('throws UPSTREAM_UNAVAILABLE when every symbol fails for other reasons', async () => {
    const service = createYahooMarketDataService(
      fakeClient({ chart: async () => Promise.reject(new Error('429 Too Many Requests')) }),
    );
    await expect(service.getHistory(['IBM', 'MSFT'], 'day')).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });
});

describe('yahoo provider: extensibility', () => {
  it('handles a company that is not in the app config with no provider changes', async () => {
    const service = createYahooMarketDataService(fakeClient(), () => NOW);
    const [quote] = await service.getQuotes(['ACN']);
    const [series] = await service.getHistory(['ACN'], 'quarter');
    expect(quote.symbol).toBe('ACN');
    expect(series.symbol).toBe('ACN');
    expect(series.points).toHaveLength(2);
  });
});


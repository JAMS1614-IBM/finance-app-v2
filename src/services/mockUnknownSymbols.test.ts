import { describe, expect, it } from 'vitest';
import { createMockMarketDataService } from './mockMarketDataService';

const service = createMockMarketDataService(() => 1_700_000_000_000);

describe('mock service: symbols without data', () => {
  it('serves quotes and history for a known extra symbol', async () => {
    const [quote] = await service.getQuotes(['NVDA']);
    expect(quote.symbol).toBe('NVDA');
    const [series] = await service.getHistory(['NVDA'], 'quarter');
    expect(series.points.length).toBeGreaterThan(0);
  });

  it('reports INVALID_SYMBOL when every requested symbol is unknown', async () => {
    await expect(service.getQuotes(['ZZZZ'])).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
    await expect(service.getHistory(['ZZZZ'], 'day')).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('returns partial results: unknown symbols are empty, never another symbol\'s data', async () => {
    const result = await service.getHistory(['IBM', 'ZZZZ'], '7d');
    expect(result.find((s) => s.symbol === 'IBM')?.points.length).toBeGreaterThan(0);
    expect(result.find((s) => s.symbol === 'ZZZZ')?.points).toEqual([]);
  });

  it('still rejects malformed symbols as before', async () => {
    await expect(service.getQuotes(['12'])).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });
});

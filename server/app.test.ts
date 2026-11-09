// @vitest-environment node
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { MarketDataError } from '../src/services/errors';
import { createMockMarketDataService } from '../src/services/mockMarketDataService';
import type { MarketDataService } from '../src/services/marketDataService';
import { createApp } from './app';

const app = createApp(createMockMarketDataService(() => 1_700_000_000_000));

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/quotes', () => {
  it('returns quotes and normalizes symbol case and whitespace', async () => {
    const res = await request(app).get('/api/quotes').query({ symbols: 'ibm, msft' });
    expect(res.status).toBe(200);
    expect(res.body.data.map((q: { symbol: string }) => q.symbol)).toEqual(['IBM', 'MSFT']);
  });

  it('rejects a missing or malformed symbol list with 400', async () => {
    expect((await request(app).get('/api/quotes')).status).toBe(400);
    const bad = await request(app).get('/api/quotes').query({ symbols: 'IBM,12$' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects too many symbols', async () => {
    const symbols = Array.from({ length: 11 }, (_, i) => 'AB' + String.fromCharCode(65 + i)).join(',');
    const res = await request(app).get('/api/quotes').query({ symbols });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/at most/i);
  });
});

describe('GET /api/history', () => {
  it('returns a series per symbol for a valid window', async () => {
    const res = await request(app).get('/api/history').query({ symbols: 'IBM,ORCL', window: '7d' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].points.length).toBeGreaterThan(1);
  });

  it('rejects an unknown window', async () => {
    const res = await request(app).get('/api/history').query({ symbols: 'IBM', window: 'year' });
    expect(res.status).toBe(400);
  });
});

describe('error mapping', () => {
  const failing = (code: ConstructorParameters<typeof MarketDataError>[0]): MarketDataService => ({
    getQuotes: async () => {
      throw new MarketDataError(code, `failed: ${code}`);
    },
    getHistory: async () => {
      throw new MarketDataError(code, `failed: ${code}`);
    },
  });

  it.each([
    ['INVALID_SYMBOL', 400],
    ['UPSTREAM_UNAVAILABLE', 502],
    ['NETWORK', 503],
  ] as const)('maps %s to HTTP %i with a stable body', async (code, status) => {
    const res = await request(createApp(failing(code))).get('/api/quotes').query({ symbols: 'IBM' });
    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error: { code, message: `failed: ${code}` } });
  });

  it('hides unexpected errors behind a 500', async () => {
    const boom: MarketDataService = {
      getQuotes: async () => {
        throw new Error('secret internals');
      },
      getHistory: async () => [],
    };
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(createApp(boom)).get('/api/quotes').query({ symbols: 'IBM' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret internals');
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

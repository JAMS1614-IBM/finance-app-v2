import { describe, expect, it, vi } from 'vitest';
import { createHttpMarketDataService } from './httpMarketDataService';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('http market data service', () => {
  it('requests the proxy with encoded params and unwraps data', async () => {
    const fetchImpl = vi.fn(async () => json(200, { data: [{ symbol: 'IBM', points: [] }] }));
    const service = createHttpMarketDataService('http://x', fetchImpl as unknown as typeof fetch);

    expect(await service.getHistory(['IBM', 'MSFT'], '7d')).toEqual([{ symbol: 'IBM', points: [] }]);
    expect(fetchImpl).toHaveBeenCalledWith('http://x/api/history?symbols=IBM%2CMSFT&window=7d');
  });

  it('turns a server error body into a typed MarketDataError', async () => {
    const fetchImpl = async () =>
      json(502, { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Yahoo is down' } });
    const service = createHttpMarketDataService('', fetchImpl as unknown as typeof fetch);
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({
      name: 'MarketDataError',
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Yahoo is down',
    });
  });

  it('maps an unstructured 400 to INVALID_SYMBOL', async () => {
    const fetchImpl = async () => new Response('bad', { status: 400 });
    const service = createHttpMarketDataService('', fetchImpl as unknown as typeof fetch);
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('maps a network failure to NETWORK', async () => {
    const fetchImpl = async () => {
      throw new TypeError('Failed to fetch');
    };
    const service = createHttpMarketDataService('', fetchImpl as unknown as typeof fetch);
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('explains how to start the API server when the dev proxy returns a body-less 500', async () => {
    const fetchImpl = async () => new Response('', { status: 500 });
    const service = createHttpMarketDataService('', fetchImpl as unknown as typeof fetch);
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      message: expect.stringContaining('npm run dev'),
    });
  });
});

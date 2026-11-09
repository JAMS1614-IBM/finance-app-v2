import type { Quote, Series, TimeWindow } from '../domain/types';
import { MarketDataError, type MarketDataErrorCode } from './errors';
import type { MarketDataService } from './marketDataService';

const KNOWN_CODES: MarketDataErrorCode[] = ['INVALID_SYMBOL', 'UPSTREAM_UNAVAILABLE', 'NETWORK'];

/** A body-less 5xx usually means the dev proxy could not reach the API server. */
function unreachableMessage(status: number): string {
  return status >= 500
    ? `Market data service is unreachable (HTTP ${status}). Is the API server running? Run "npm run dev" (starts the API server and the UI together), or "npm run dev:server" in a second terminal.`
    : `Market data request failed (HTTP ${status}).`;
}

/** Talks to the server proxy (`/api/...`). The browser never calls Yahoo directly. */
export function createHttpMarketDataService(
  baseUrl = '',
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): MarketDataService {
  async function get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = `${baseUrl}${path}?${new URLSearchParams(params)}`;

    let response: Response;
    try {
      response = await fetchImpl(url);
    } catch {
      throw new MarketDataError('NETWORK', 'Could not reach the market data service.');
    }

    let body: { data?: T; error?: { code?: string; message?: string } } | undefined;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    if (!response.ok || !body || body.data === undefined) {
      const code = KNOWN_CODES.find((c) => c === body?.error?.code);
      throw new MarketDataError(
        code ?? (response.status === 400 ? 'INVALID_SYMBOL' : 'UPSTREAM_UNAVAILABLE'),
        body?.error?.message ?? unreachableMessage(response.status),
      );
    }
    return body.data;
  }

  return {
    getQuotes: (symbols: string[]) => get<Quote[]>('/api/quotes', { symbols: symbols.join(',') }),
    getHistory: (symbols: string[], window: TimeWindow) =>
      get<Series[]>('/api/history', { symbols: symbols.join(','), window }),
  };
}

import type { PricePoint, Quote, Series, TimeWindow } from '../../src/domain/types';
import { MarketDataError } from '../../src/services/errors';
import type { MarketDataService } from '../../src/services/marketDataService';

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far back to fetch, and at what interval, for each window. */
export const YAHOO_WINDOWS: Record<TimeWindow, { lookbackMs: number; interval: '5m' | '30m' | '1d' }> = {
  // Five days of 5m bars so a weekend or holiday still contains a full session.
  day: { lookbackMs: 5 * DAY_MS, interval: '5m' },
  '7d': { lookbackMs: 7 * DAY_MS, interval: '30m' },
  quarter: { lookbackMs: 92 * DAY_MS, interval: '1d' },
};

/** The slice of yahoo-finance2 this provider uses. Narrow so tests can fake it. */
export interface YahooClient {
  quote(symbols: string[]): Promise<
    {
      symbol: string;
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
    }[]
  >;
  chart(
    symbol: string,
    options: { period1: Date; interval: '5m' | '30m' | '1d' },
  ): Promise<{ quotes: { date: Date; close: number | null }[] }>;
}

const NOT_FOUND = /no data found|not found|delisted/i;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createYahooMarketDataService(
  client: YahooClient,
  now: () => number = Date.now,
): MarketDataService {
  return {
    async getQuotes(symbols): Promise<Quote[]> {
      let raw;
      try {
        raw = await client.quote(symbols);
      } catch (error) {
        throw new MarketDataError('UPSTREAM_UNAVAILABLE', `Yahoo Finance request failed: ${messageOf(error)}`);
      }

      const quotes: Quote[] = [];
      for (const q of raw) {
        if (typeof q.regularMarketPrice !== 'number') continue;
        quotes.push({
          symbol: q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
        });
      }
      if (quotes.length === 0) {
        throw new MarketDataError('INVALID_SYMBOL', `No quote found for: ${symbols.join(', ')}`);
      }
      return quotes;
    },

    /**
     * Partial success: a symbol that fails comes back as an empty series so the
     * rest of the dashboard still renders. Throws only if every symbol failed.
     */
    async getHistory(symbols, window): Promise<Series[]> {
      const { lookbackMs, interval } = YAHOO_WINDOWS[window];
      const period1 = new Date(now() - lookbackMs);

      const results = await Promise.allSettled(
        symbols.map(async (symbol): Promise<Series> => {
          const chart = await client.chart(symbol, { period1, interval });
          const points: PricePoint[] = [];
          for (const bar of chart.quotes) {
            if (typeof bar.close === 'number' && Number.isFinite(bar.close)) {
              points.push({ t: bar.date.getTime(), price: bar.close });
            }
          }
          return { symbol, points };
        }),
      );

      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failures.length === symbols.length) {
        const allNotFound = failures.every((f) => NOT_FOUND.test(messageOf(f.reason)));
        throw allNotFound
          ? new MarketDataError('INVALID_SYMBOL', `No data found for: ${symbols.join(', ')}`)
          : new MarketDataError('UPSTREAM_UNAVAILABLE', `Yahoo Finance request failed: ${messageOf(failures[0].reason)}`);
      }

      return results.map((r, i) => (r.status === 'fulfilled' ? r.value : { symbol: symbols[i], points: [] }));
    },
  };
}

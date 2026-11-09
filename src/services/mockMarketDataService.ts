import { SYMBOL_PATTERN } from '../domain/symbols';
import type { PricePoint, Quote, Series, TimeWindow } from '../domain/types';
import { MarketDataError } from './errors';
import type { MarketDataService } from './marketDataService';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Sample count and spacing per window. */
const WINDOW_SHAPE: Record<TimeWindow, { count: number; step: number }> = {
  day: { count: 78, step: 5 * MINUTE },
  '7d': { count: 7 * 8, step: 3 * 60 * MINUTE },
  quarter: { count: 65, step: DAY },
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small seeded PRNG (mulberry32) so output is repeatable. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPoints(symbol: string, window: TimeWindow, now: number): PricePoint[] {
  const { count, step } = WINDOW_SHAPE[window];
  const random = rng(hash(`${symbol}:${window}`));
  let price = 50 + (hash(symbol) % 300);
  const points: PricePoint[] = [];
  for (let i = 0; i < count; i++) {
    price = Math.max(1, price * (1 + (random() - 0.48) * 0.01));
    points.push({ t: now - (count - 1 - i) * step, price: Math.round(price * 100) / 100 });
  }
  return points;
}

function assertValid(symbols: string[]): void {
  for (const symbol of symbols) {
    if (!SYMBOL_PATTERN.test(symbol)) {
      throw new MarketDataError('INVALID_SYMBOL', `Unsupported symbol: "${symbol}"`);
    }
  }
}

/** Deterministic sample data. Used for the default app, tests, and offline demos. */
export function createMockMarketDataService(now: () => number = () => Date.now()): MarketDataService {
  return {
    async getHistory(symbols, window): Promise<Series[]> {
      assertValid(symbols);
      const end = now();
      return symbols.map((symbol) => ({ symbol, points: buildPoints(symbol, window, end) }));
    },

    async getQuotes(symbols): Promise<Quote[]> {
      assertValid(symbols);
      const end = now();
      return symbols.map((symbol) => {
        const points = buildPoints(symbol, 'day', end);
        const open = points[0].price;
        const price = points[points.length - 1].price;
        const change = Math.round((price - open) * 100) / 100;
        return {
          symbol,
          price,
          change,
          changePercent: Math.round((change / open) * 10_000) / 100,
        };
      });
    },
  };
}

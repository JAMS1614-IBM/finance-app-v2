import { describe, expect, it } from 'vitest';
import { rankByPerformance, windowChangePercent } from './metrics';
import { isStale, lastSession } from './session';

const HOUR = 3_600_000;

describe('windowChangePercent', () => {
  it('is the percent change from first to last point', () => {
    expect(windowChangePercent({ symbol: 'A', points: [{ t: 1, price: 50 }, { t: 2, price: 55 }] })).toBe(10);
  });

  it('is null without data', () => {
    expect(windowChangePercent({ symbol: 'A', points: [] })).toBeNull();
  });
});

describe('rankByPerformance', () => {
  it('orders best first, breaks ties by symbol, and puts no-data last', () => {
    const up = (symbol: string, end: number) => ({
      symbol,
      points: [{ t: 1, price: 100 }, { t: 2, price: end }],
    });
    const ranked = rankByPerformance([
      { symbol: 'NONE', points: [] },
      up('B', 105),
      up('LOSS', 90),
      up('A', 105),
      up('TOP', 120),
    ]);
    expect(ranked.map((r) => r.symbol)).toEqual(['TOP', 'A', 'B', 'LOSS', 'NONE']);
    expect(ranked.at(-1)?.changePercent).toBeNull();
  });
});

describe('lastSession', () => {
  it('keeps only the points after the last large gap', () => {
    const points = [
      { t: 0, price: 1 },
      { t: HOUR, price: 2 },
      { t: 20 * HOUR, price: 3 },
      { t: 21 * HOUR, price: 4 },
    ];
    expect(lastSession(points).map((p) => p.price)).toEqual([3, 4]);
  });

  it('handles unsorted and empty input', () => {
    expect(lastSession([{ t: 2, price: 2 }, { t: 1, price: 1 }]).map((p) => p.price)).toEqual([1, 2]);
    expect(lastSession([])).toEqual([]);
  });
});

describe('isStale', () => {
  const series = [{ symbol: 'A', points: [{ t: 1000, price: 1 }] }];
  it('detects old data', () => {
    expect(isStale(series, 1000 + 7 * HOUR)).toBe(true);
    expect(isStale(series, 1000 + HOUR)).toBe(false);
  });
  it('is false when there is no data', () => {
    expect(isStale([{ symbol: 'A', points: [] }], Date.now())).toBe(false);
  });
});

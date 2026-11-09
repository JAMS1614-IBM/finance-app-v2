import { describe, expect, it } from 'vitest';
import { rebaseToPercent, toChartRows } from './normalize';

describe('rebaseToPercent', () => {
  it('rebases each series to percent change from its first point', () => {
    const [s] = rebaseToPercent([
      { symbol: 'IBM', points: [{ t: 1, price: 100 }, { t: 2, price: 110 }, { t: 3, price: 90 }] },
    ]);
    expect(s.points.map((p) => p.price)).toEqual([0, 10, -10]);
  });

  it('sorts by time and drops non-finite points', () => {
    const [s] = rebaseToPercent([
      { symbol: 'IBM', points: [{ t: 2, price: 200 }, { t: 1, price: 100 }, { t: 3, price: NaN }] },
    ]);
    expect(s.points).toEqual([{ t: 1, price: 0 }, { t: 2, price: 100 }]);
  });

  it('returns an empty series when there is no usable base price', () => {
    expect(rebaseToPercent([{ symbol: 'X', points: [] }])[0].points).toEqual([]);
  });
});

describe('toChartRows', () => {
  it('merges series by timestamp and leaves gaps absent', () => {
    const rows = toChartRows([
      { symbol: 'A', points: [{ t: 1, price: 1 }, { t: 2, price: 2 }] },
      { symbol: 'B', points: [{ t: 2, price: 20 }] },
    ]);
    expect(rows).toEqual([
      { t: 1, A: 1 },
      { t: 2, A: 2, B: 20 },
    ]);
  });
});

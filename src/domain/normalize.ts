import type { Series } from './types';

/** A row for charting: one timestamp plus one value per symbol. */
export type ChartRow = { t: number } & Record<string, number>;

/**
 * Drops invalid points, sorts by time, and rebases each series to
 * percent change from its first point so companies are comparable.
 */
export function rebaseToPercent(series: Series[]): Series[] {
  return series.map((s) => {
    const points = s.points
      .filter((p) => Number.isFinite(p.price) && Number.isFinite(p.t))
      .sort((a, b) => a.t - b.t);
    const base = points[0]?.price;
    if (!base) return { symbol: s.symbol, points: [] };
    return {
      symbol: s.symbol,
      points: points.map((p) => ({ t: p.t, price: ((p.price - base) / base) * 100 })),
    };
  });
}

/** Merges per-symbol series into rows keyed by timestamp. Gaps stay absent. */
export function toChartRows(series: Series[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();
  for (const s of series) {
    for (const p of s.points) {
      const row = rows.get(p.t) ?? ({ t: p.t } as ChartRow);
      row[s.symbol] = p.price;
      rows.set(p.t, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

import { rebaseToPercent } from './normalize';
import type { Series } from './types';

export interface RankedPerformance {
  symbol: string;
  /** Percent change over the window, or null when the series has no usable data. */
  changePercent: number | null;
}

export function windowChangePercent(series: Series): number | null {
  const [rebased] = rebaseToPercent([series]);
  return rebased.points.at(-1)?.price ?? null;
}

/** Best performer first. Ties break by symbol; symbols without data go last. */
export function rankByPerformance(series: Series[]): RankedPerformance[] {
  return series
    .map((s) => ({ symbol: s.symbol, changePercent: windowChangePercent(s) }))
    .sort((a, b) => {
      if (a.changePercent === b.changePercent) return a.symbol.localeCompare(b.symbol);
      if (a.changePercent === null) return 1;
      if (b.changePercent === null) return -1;
      return b.changePercent - a.changePercent;
    });
}

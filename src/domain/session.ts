import type { PricePoint, Series } from './types';

const HOUR = 60 * 60 * 1000;

/**
 * Keeps only the most recent trading session: walks back from the last point
 * until a gap larger than `maxGapMs` (overnight, weekend, holiday) is found.
 * Timezone-agnostic, so it works for any exchange.
 */
export function lastSession(points: PricePoint[], maxGapMs = 6 * HOUR): PricePoint[] {
  const sorted = [...points].sort((a, b) => a.t - b.t);
  let start = Math.max(sorted.length - 1, 0);
  while (start > 0 && sorted[start].t - sorted[start - 1].t <= maxGapMs) start--;
  return sorted.slice(start);
}

/** True when the newest point across all series is older than `maxAgeMs`. */
export function isStale(series: Series[], now: number, maxAgeMs = 6 * HOUR): boolean {
  const newest = Math.max(...series.flatMap((s) => s.points.map((p) => p.t)));
  return Number.isFinite(newest) && now - newest > maxAgeMs;
}

export type TimeWindow = 'day' | '7d' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
  color: string;
  /** The company the dashboard is about (IBM). Highlighted in charts. Exactly one. */
  primary?: boolean;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface PricePoint {
  /** Epoch milliseconds. */
  t: number;
  price: number;
}

export interface Series {
  symbol: string;
  points: PricePoint[];
}

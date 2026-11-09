import type { Quote, Series, TimeWindow } from '../domain/types';

/**
 * The only contract the UI depends on. Swap implementations (mock, HTTP proxy
 * to Yahoo Finance, another vendor) without touching components.
 */
export interface MarketDataService {
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getHistory(symbols: string[], window: TimeWindow): Promise<Series[]>;
}

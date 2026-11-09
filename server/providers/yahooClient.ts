import YahooFinance from 'yahoo-finance2';
import type { YahooClient } from './yahooProvider';

/** Adapts the real yahoo-finance2 library to the narrow YahooClient the provider uses. */
export function createYahooClient(): YahooClient {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  return {
    async quote(symbols) {
      const results = await yf.quote(symbols);
      // Some Yahoo quote variants (e.g. ECN quotes) carry no symbol; they can't be matched to a request.
      return results.flatMap((q) => ('symbol' in q && typeof q.symbol === 'string' ? [{ ...q, symbol: q.symbol }] : []));
    },
    chart: (symbol, options) => yf.chart(symbol, options),
  };
}

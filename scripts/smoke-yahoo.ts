// Live check against the real Yahoo Finance API. Run manually: npm run smoke:yahoo
// Not part of CI: Yahoo is unofficial and can rate limit or change without notice.
import { SYMBOLS as symbols } from '../src/config/companies';
import { createYahooClient } from '../server/providers/yahooClient';
import { createYahooMarketDataService } from '../server/providers/yahooProvider';

const service = createYahooMarketDataService(createYahooClient());

const quotes = await service.getQuotes(symbols);
console.table(quotes);

for (const window of ['day', '7d', 'quarter'] as const) {
  const series = await service.getHistory(symbols, window);
  console.log(`\n${window}:`);
  console.table(series.map((s) => ({ symbol: s.symbol, points: s.points.length })));
  if (series.some((s) => s.points.length === 0)) {
    console.error(`FAIL: empty series in window "${window}"`);
    process.exitCode = 1;
  }
}
console.log(process.exitCode ? '\nSmoke check FAILED' : '\nSmoke check passed');

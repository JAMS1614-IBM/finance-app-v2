import { createMockMarketDataService } from '../src/services/mockMarketDataService';
import type { MarketDataService } from '../src/services/marketDataService';
import { createApp } from './app';
import { withCache } from './cache';
import { createYahooClient } from './providers/yahooClient';
import { createYahooMarketDataService } from './providers/yahooProvider';

const useMock = process.env.MARKET_DATA_PROVIDER === 'mock';
const provider: MarketDataService = useMock
  ? createMockMarketDataService()
  : createYahooMarketDataService(createYahooClient());

const port = Number(process.env.PORT ?? 3001);

createApp(withCache(provider)).listen(port, () => {
  console.log(`Market data proxy listening on http://localhost:${port} (provider: ${useMock ? 'mock' : 'yahoo'})`);
});

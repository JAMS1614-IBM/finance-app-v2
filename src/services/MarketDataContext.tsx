import { createContext, useContext, type ReactNode } from 'react';
import type { MarketDataService } from './marketDataService';

const MarketDataContext = createContext<MarketDataService | null>(null);

export function MarketDataProvider({
  service,
  children,
}: {
  service: MarketDataService;
  children: ReactNode;
}) {
  return <MarketDataContext.Provider value={service}>{children}</MarketDataContext.Provider>;
}

export function useMarketDataService(): MarketDataService {
  const service = useContext(MarketDataContext);
  if (!service) throw new Error('useMarketDataService must be used inside <MarketDataProvider>');
  return service;
}

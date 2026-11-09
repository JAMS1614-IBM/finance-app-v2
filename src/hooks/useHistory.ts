import type { TimeWindow } from '../domain/types';
import { useMarketDataService } from '../services/MarketDataContext';
import { useAsync } from './useAsync';

export function useHistory(symbols: string[], window: TimeWindow) {
  const service = useMarketDataService();
  return useAsync(() => service.getHistory(symbols, window), `${window}:${symbols.join(',')}`);
}

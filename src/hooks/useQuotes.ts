import { useMarketDataService } from '../services/MarketDataContext';
import { useAsync } from './useAsync';

export function useQuotes(symbols: string[]) {
  const service = useMarketDataService();
  return useAsync(() => service.getQuotes(symbols), symbols.join(','));
}

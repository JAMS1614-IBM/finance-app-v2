import { MarketDataProvider } from './services/MarketDataContext';
import type { MarketDataService } from './services/marketDataService';
import { DashboardPage } from './pages/DashboardPage';

/** The data source is injected (see main.tsx), which keeps the UI testable and vendor-neutral. */
export function App({ service }: { service: MarketDataService }) {
  return (
    <MarketDataProvider service={service}>
      <DashboardPage />
    </MarketDataProvider>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createHttpMarketDataService } from './services/httpMarketDataService';
import { createMockMarketDataService } from './services/mockMarketDataService';
import './styles.css';

// Live data goes through the server proxy (`npm run dev:server`).
// `npm run dev:mock` sets VITE_DATA_SOURCE=mock to run with sample data and no server.
const service =
  import.meta.env.VITE_DATA_SOURCE === 'mock' ? createMockMarketDataService() : createHttpMarketDataService();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App service={service} />
  </StrictMode>,
);

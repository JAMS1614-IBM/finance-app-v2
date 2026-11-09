import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { COMPANIES } from './config/companies';
import { MarketDataError } from './services/errors';
import type { MarketDataService } from './services/marketDataService';
import { createMockMarketDataService } from './services/mockMarketDataService';

// vi.mock is hoisted above imports, so the helper is loaded lazily inside the factory.
vi.mock('recharts', async (importOriginal) => (await import('./test/mockRecharts')).mockRecharts(importOriginal));

beforeEach(() => {
  globalThis.history.replaceState(null, '', '/');
});

const COMPANY_COUNT = COMPANIES.length;

describe('Dashboard', () => {
  it('renders a quote card per company and the comparison chart', async () => {
    render(<App service={createMockMarketDataService()} />);

    for (const c of COMPANIES) {
      expect(await screen.findByLabelText(`${c.name} quote`)).toBeInTheDocument();
    }
    const chart = await screen.findByTestId('comparison-chart');
    expect(chart).toHaveAttribute('data-series', String(COMPANIES.length));
  });

  it('switches time window and reflects it in the URL', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');

    await user.click(screen.getByRole('tab', { name: 'Last Quarter' }));

    expect(screen.getByRole('tab', { name: 'Last Quarter' })).toHaveAttribute('aria-selected', 'true');
    expect(globalThis.location.search).toBe('?window=quarter');
    expect(await screen.findByRole('region', { name: /Last Quarter/ })).toBeInTheDocument();
  });

  it('shows an error with retry when history fails, then recovers', async () => {
    const user = userEvent.setup();
    const healthy = createMockMarketDataService();
    let failures = 1;
    const flaky: MarketDataService = {
      getQuotes: healthy.getQuotes,
      getHistory: async (symbols, window) => {
        if (failures-- > 0) throw new MarketDataError('UPSTREAM_UNAVAILABLE', 'Data source unavailable');
        return healthy.getHistory(symbols, window);
      },
    };

    render(<App service={flaky} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Data source unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('comparison-chart')).toBeInTheDocument();
  });

  it('shows a ranking table with every company on each window', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);

    for (const tab of ['Current Day', 'Last 7 Days', 'Last Quarter']) {
      await user.click(screen.getByRole('tab', { name: tab }));
      const table = await screen.findByRole('table', { name: 'Performance ranking' });
      expect(within(table).getAllByRole('row')).toHaveLength(COMPANY_COUNT + 1);
    }
  });

  it('tells the user when the market is closed and data is from an earlier session', async () => {
    const stale = createMockMarketDataService(() => Date.now() - 3 * 24 * 60 * 60 * 1000);
    render(<App service={stale} />);
    expect(await screen.findByRole('note')).toHaveTextContent(/market closed/i);
  });

  it('does not show the closed notice for fresh data', async () => {
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { MarketDataError } from '../../services/errors';
import type { MarketDataService } from '../../services/marketDataService';
import { createMockMarketDataService } from '../../services/mockMarketDataService';

vi.mock('recharts', async (importOriginal) => (await import('../../test/mockRecharts')).mockRecharts(importOriginal));

beforeEach(() => {
  globalThis.history.replaceState(null, '', '/');
});

/** Wraps the mock service so tests can see which symbols were requested. */
function spied() {
  const base = createMockMarketDataService();
  const calls: string[][] = [];
  const service: MarketDataService = {
    getQuotes: (symbols) => {
      calls.push(symbols);
      return base.getQuotes(symbols);
    },
    getHistory: (symbols, window) => {
      calls.push(symbols);
      return base.getHistory(symbols, window);
    },
  };
  return { service, calls };
}

async function load(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.clear(screen.getByLabelText('Ticker symbol'));
  await user.type(screen.getByLabelText('Ticker symbol'), text);
  await user.click(screen.getByRole('button', { name: 'Load' }));
}

describe('Custom company panel', () => {
  it('shows only the input form until a symbol is loaded (AC-1)', async () => {
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');
    expect(screen.getByLabelText('Ticker symbol')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.getAllByTestId('comparison-chart')).toHaveLength(1);
  });

  it('rejects malformed and empty input inline without fetching (AC-2)', async () => {
    const user = userEvent.setup();
    const { service, calls } = spied();
    render(<App service={service} />);
    await screen.findByTestId('comparison-chart');
    const before = calls.length;

    await load(user, 'IBM1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/ticker must be/i);

    await user.clear(screen.getByLabelText('Ticker symbol'));
    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a ticker symbol/i);

    expect(calls.length).toBe(before);
    expect(screen.getAllByTestId('comparison-chart')).toHaveLength(1);
  });

  it('shows a loading state while the request is in flight (AC-3)', async () => {
    const user = userEvent.setup();
    const base = createMockMarketDataService();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const slow: MarketDataService = {
      getQuotes: (symbols) => (symbols.includes('NVDA') ? gate.then(() => base.getQuotes(symbols)) : base.getQuotes(symbols)),
      getHistory: (symbols, window) => (symbols.includes('NVDA') ? gate.then(() => base.getHistory(symbols, window)) : base.getHistory(symbols, window)),
    };
    render(<App service={slow} />);
    await screen.findByTestId('comparison-chart');

    await load(user, 'nvda');
    const panel = await screen.findByRole('region', { name: /NVDA vs\. IBM/ });
    expect(within(panel).getByText(/loading/i)).toBeInTheDocument();

    release();
    expect(await within(panel).findByTestId('comparison-chart')).toBeInTheDocument();
  });

  it('shows a quote card and a chart of the symbol against IBM (AC-5)', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');

    await load(user, 'nvda');

    const panel = await screen.findByRole('region', { name: /NVDA vs\. IBM/ });
    expect(await within(panel).findByLabelText('NVDA quote')).toBeInTheDocument();
    expect(await within(panel).findByTestId('comparison-chart')).toHaveAttribute('data-series', '2');
  });

  it('shows a clear no-data message, never another company\'s data (AC-4)', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');

    await load(user, 'AAPL');

    expect(await screen.findByText(/No data found for symbol "AAPL"/)).toBeInTheDocument();
    expect(screen.queryByLabelText('AAPL quote')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('comparison-chart')).toHaveLength(1);
  });

  it('shows a no-data message when history comes back empty for the symbol (AC-4)', async () => {
    const user = userEvent.setup();
    const base = createMockMarketDataService();
    const empty: MarketDataService = {
      getQuotes: base.getQuotes,
      getHistory: async (symbols, window) =>
        symbols.includes('NVDA') ? symbols.map((symbol) => ({ symbol, points: [] })) : base.getHistory(symbols, window),
    };
    render(<App service={empty} />);
    await screen.findByTestId('comparison-chart');

    await load(user, 'NVDA');

    expect(await screen.findByText(/No data found for symbol "NVDA"/)).toBeInTheDocument();
  });

  it('reports an upstream failure with Retry, not as "no data" (AC-9)', async () => {
    const user = userEvent.setup();
    const base = createMockMarketDataService();
    let failing = true;
    const flaky: MarketDataService = {
      getQuotes: base.getQuotes,
      getHistory: async (symbols, window) => {
        if (failing && symbols.includes('NVDA')) throw new MarketDataError('UPSTREAM_UNAVAILABLE', 'Data source unavailable');
        return base.getHistory(symbols, window);
      },
    };
    render(<App service={flaky} />);
    await screen.findByTestId('comparison-chart');

    await load(user, 'NVDA');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Data source unavailable');
    expect(screen.queryByText(/No data found/)).not.toBeInTheDocument();

    failing = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByLabelText('NVDA quote')).toBeInTheDocument();
  });

  it('removes the panel when Clear is clicked (AC-7)', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');
    await load(user, 'NVDA');
    expect(await screen.findByLabelText('NVDA quote')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByLabelText('NVDA quote')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Ticker symbol')).toHaveValue('');
  });

  it('survives switching the time window (AC-8)', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');
    await load(user, 'NVDA');
    expect(await screen.findByLabelText('NVDA quote')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Last Quarter' }));

    const panel = await screen.findByRole('region', { name: /NVDA vs\. IBM/ });
    expect(await within(panel).findByText(/Last Quarter, percent change/)).toBeInTheDocument();
    expect(within(panel).getByLabelText('NVDA quote')).toBeInTheDocument();
  });

  it('charts IBM on its own when IBM is the chosen symbol', async () => {
    const user = userEvent.setup();
    render(<App service={createMockMarketDataService()} />);
    await screen.findByTestId('comparison-chart');

    await load(user, 'ibm');

    const panel = await screen.findByRole('region', { name: 'IBM' });
    expect(await within(panel).findByTestId('comparison-chart')).toHaveAttribute('data-series', '1');
  });
});

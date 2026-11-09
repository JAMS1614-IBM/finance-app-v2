import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COMPANIES } from '../../config/companies';
import { MarketDataError } from '../../services/errors';
import { MarketDataProvider } from '../../services/MarketDataContext';
import type { MarketDataService } from '../../services/marketDataService';
import { QuoteCard } from './QuoteCard';
import { QuoteGrid } from './QuoteGrid';

const ibm = COMPANIES[0];

describe('QuoteCard', () => {
  it('shows an up arrow and green styling for a gain', () => {
    render(<QuoteCard company={ibm} quote={{ symbol: 'IBM', price: 245.5, change: 1.25, changePercent: 0.51 }} />);
    const card = screen.getByLabelText('IBM quote');
    expect(card).toHaveTextContent('$245.50');
    expect(card).toHaveTextContent('▲ 1.25 (0.51%)');
    expect(card.querySelector('.change')).toHaveClass('up');
  });

  it('shows a down arrow and red styling for a loss', () => {
    render(<QuoteCard company={ibm} quote={{ symbol: 'IBM', price: 240, change: -2.5, changePercent: -1.03 }} />);
    const card = screen.getByLabelText('IBM quote');
    expect(card).toHaveTextContent('▼ -2.50 (-1.03%)');
    expect(card.querySelector('.change')).toHaveClass('down');
  });

  it('shows "No data" when the quote is missing', () => {
    render(<QuoteCard company={ibm} quote={undefined} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});

describe('QuoteGrid', () => {
  beforeEach(() => vi.clearAllMocks());

  const service = (getQuotes: MarketDataService['getQuotes']): MarketDataService => ({
    getQuotes,
    getHistory: async () => [],
  });
  const renderGrid = (s: MarketDataService) =>
    render(
      <MarketDataProvider service={s}>
        <QuoteGrid />
      </MarketDataProvider>,
    );

  it('shows a loading state, then a card per company', async () => {
    renderGrid(
      service(async (symbols) => symbols.map((symbol) => ({ symbol, price: 10, change: 0, changePercent: 0 }))),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading quotes');
    for (const c of COMPANIES) expect(await screen.findByLabelText(`${c.name} quote`)).toBeInTheDocument();
  });

  it('shows "No data" for a company the service did not return', async () => {
    renderGrid(service(async () => [{ symbol: 'IBM', price: 10, change: 0, changePercent: 0 }]));
    await screen.findByLabelText('IBM quote');
    expect(screen.getAllByText('No data')).toHaveLength(COMPANIES.length - 1);
  });

  it('shows the error and recovers after Retry', async () => {
    const getQuotes = vi
      .fn<MarketDataService['getQuotes']>()
      .mockRejectedValueOnce(new MarketDataError('NETWORK', 'Could not reach the market data service.'))
      .mockImplementation(async (symbols) => symbols.map((symbol) => ({ symbol, price: 1, change: 0, changePercent: 0 })));
    renderGrid(service(getQuotes));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the market data service.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByLabelText('IBM quote')).toBeInTheDocument();
    expect(getQuotes).toHaveBeenCalledTimes(2);
  });
});

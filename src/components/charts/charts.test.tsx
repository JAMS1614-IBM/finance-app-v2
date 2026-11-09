import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Company, Series } from '../../domain/types';
import { ChartCard } from './ChartCard';
import { ComparisonLineChart, formatTick } from './ComparisonLineChart';

// vi.mock is hoisted above imports, so the helper is loaded lazily inside the factory.
vi.mock('recharts', async (importOriginal) => (await import('../../test/mockRecharts')).mockRecharts(importOriginal));

const companies: Company[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe', primary: true },
  { symbol: 'MSFT', name: 'Microsoft', color: '#198038' },
];
const series: Series[] = companies.map((c) => ({
  symbol: c.symbol,
  points: [
    { t: 1_700_000_000_000, price: 100 },
    { t: 1_700_000_300_000, price: 101 },
  ],
}));

describe('ChartCard', () => {
  it('shows only the loading state while loading', () => {
    render(<ChartCard title="T" status="loading"><p>chart</p></ChartCard>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('chart')).not.toBeInTheDocument();
  });

  it('shows the error message and calls onRetry', async () => {
    const onRetry = vi.fn();
    render(
      <ChartCard title="T" status="error" error={new Error('boom')} onRetry={onRetry}>
        <p>chart</p>
      </ChartCard>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('falls back to a generic message when no error is given', () => {
    render(<ChartCard title="T" status="error"><p>chart</p></ChartCard>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });

  it('renders the title, subtitle and children on success', () => {
    render(<ChartCard title="Perf" subtitle="Sub" status="success"><p>chart</p></ChartCard>);
    expect(screen.getByRole('region', { name: 'Perf' })).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
    expect(screen.getByText('chart')).toBeInTheDocument();
  });
});

describe('ComparisonLineChart', () => {
  it.each(['day', '7d', 'quarter'] as const)('renders one line per company for the %s window', (window) => {
    const { container } = render(<ComparisonLineChart series={series} companies={companies} window={window} />);
    expect(screen.getByTestId('comparison-chart')).toHaveAttribute('data-series', '2');
    expect(container.querySelectorAll('.recharts-line')).toHaveLength(2);
  });

  it('draws the primary company with a thicker line', () => {
    const { container } = render(<ComparisonLineChart series={series} companies={companies} window="7d" />);
    const widths = [...container.querySelectorAll('.recharts-line path.recharts-line-curve')].map((p) =>
      p.getAttribute('stroke-width'),
    );
    expect(widths).toEqual(['3', '1.5']);
  });
});

describe('formatTick', () => {
  const t = Date.UTC(2026, 0, 15, 14, 30);
  it('uses a different label style per window', () => {
    const day = formatTick(t, 'day');
    const week = formatTick(t, '7d');
    const quarter = formatTick(t, 'quarter');
    expect(day).toMatch(/\d{1,2}:\d{2}/);
    expect(week).toMatch(/^[A-Za-z]+$/);
    expect(quarter).toMatch(/[A-Za-z]+\.? \d{1,2}|\d{1,2}[ /][A-Za-z]+/);
    expect(new Set([day, week, quarter]).size).toBe(3);
  });
});

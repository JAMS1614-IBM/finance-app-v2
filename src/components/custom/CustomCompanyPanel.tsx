import { useState, type FormEvent } from 'react';
import { COMPANIES } from '../../config/companies';
import { lastSession } from '../../domain/session';
import { parseSymbol } from '../../domain/symbols';
import { windowLabel } from '../../domain/timeWindows';
import type { Company, TimeWindow } from '../../domain/types';
import { useHistory } from '../../hooks/useHistory';
import { useQuotes } from '../../hooks/useQuotes';
import { MarketDataError } from '../../services/errors';
import { ChartCard } from '../charts/ChartCard';
import { ComparisonLineChart } from '../charts/ComparisonLineChart';
import { QuoteCard } from '../summary/QuoteCard';

const PRIMARY = COMPANIES.find((c) => c.primary) ?? COMPANIES[0];
const CUSTOM_COLOR = '#ee5396';

const isNoData = (error: Error) => error instanceof MarketDataError && error.code === 'INVALID_SYMBOL';

/** Fetches and charts one user-chosen symbol against the primary company. Mounted only once a symbol is set. */
function CustomCompanyResult({ symbol, window }: { symbol: string; window: TimeWindow }) {
  const custom: Company = { symbol, name: symbol, color: CUSTOM_COLOR };
  const isPrimary = symbol === PRIMARY.symbol;
  const symbols = isPrimary ? [symbol] : [PRIMARY.symbol, symbol];

  const history = useHistory(symbols, window);
  const quotes = useQuotes([symbol]);

  const selected = history.status === 'success' ? history.data.find((s) => s.symbol === symbol) : undefined;
  // Never fall back to another company's data: an unknown symbol is reported as such.
  const noData =
    (history.status === 'error' && isNoData(history.error)) ||
    (quotes.status === 'error' && isNoData(quotes.error)) ||
    (history.status === 'success' && !selected?.points.length);

  const failure =
    history.status === 'error' ? history.error : quotes.status === 'error' ? quotes.error : undefined;
  const status = noData
    ? 'success'
    : failure
      ? 'error'
      : history.status === 'loading' || quotes.status === 'loading'
        ? 'loading'
        : 'success';

  const series =
    history.status === 'success'
      ? window === 'day'
        ? history.data.map((s) => ({ ...s, points: lastSession(s.points) }))
        : history.data
      : [];

  return (
    <ChartCard
      title={isPrimary ? symbol : `${symbol} vs. ${PRIMARY.name}`}
      subtitle={`${windowLabel(window)}, percent change`}
      status={status}
      error={failure}
      onRetry={() => {
        history.retry();
        quotes.retry();
      }}
    >
      {noData ? (
        <p role="status" className="state">
          No data found for symbol &quot;{symbol}&quot;. Check the ticker and try again.
        </p>
      ) : (
        <>
          <QuoteCard company={custom} quote={quotes.status === 'success' ? quotes.data.find((q) => q.symbol === symbol) : undefined} />
          <ComparisonLineChart series={series} companies={isPrimary ? [custom] : [PRIMARY, custom]} window={window} />
        </>
      )}
    </ChartCard>
  );
}

/** Ticker input plus a chart for the chosen company. Renders nothing extra until a symbol is loaded. */
export function CustomCompanyPanel({ window }: { window: TimeWindow }) {
  const [input, setInput] = useState('');
  const [symbol, setSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseSymbol(input);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(null);
    setInput(parsed.symbol);
    setSymbol(parsed.symbol);
  }

  function clear() {
    setInput('');
    setSymbol(null);
    setError(null);
  }

  return (
    <div className="custom-company">
      <section className="card" aria-label="Custom company">
        <h2>Custom Company Chart</h2>
        <p className="muted">Enter a ticker symbol to chart it against {PRIMARY.name}.</p>
        <form className="custom-company-form" onSubmit={submit}>
          <label htmlFor="custom-symbol">Ticker symbol</label>
          <input
            id="custom-symbol"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. NVDA"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'custom-symbol-error' : undefined}
          />
          <button type="submit">Load</button>
          {symbol && (
            <button type="button" onClick={clear}>
              Clear
            </button>
          )}
        </form>
        {error && (
          <p id="custom-symbol-error" role="alert" className="field-error">
            {error}
          </p>
        )}
      </section>

      {symbol && <CustomCompanyResult symbol={symbol} window={window} />}
    </div>
  );
}

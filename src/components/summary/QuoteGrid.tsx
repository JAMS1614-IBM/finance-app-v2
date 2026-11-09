import { COMPANIES, SYMBOLS } from '../../config/companies';
import { useQuotes } from '../../hooks/useQuotes';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import { QuoteCard } from './QuoteCard';

export function QuoteGrid() {
  const quotes = useQuotes(SYMBOLS);

  if (quotes.status === 'loading') return <LoadingState label="Loading quotes…" />;
  if (quotes.status === 'error') return <ErrorState message={quotes.error.message} onRetry={quotes.retry} />;

  return (
    <div className="quote-grid">
      {COMPANIES.map((c) => (
        <QuoteCard key={c.symbol} company={c} quote={quotes.data.find((q) => q.symbol === c.symbol)} />
      ))}
    </div>
  );
}

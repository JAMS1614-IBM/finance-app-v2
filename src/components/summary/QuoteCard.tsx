import type { Company, Quote } from '../../domain/types';

export function QuoteCard({ company, quote }: { company: Company; quote: Quote | undefined }) {
  const up = (quote?.change ?? 0) >= 0;
  return (
    <article className="card quote-card" aria-label={`${company.name} quote`}>
      <h3 style={{ color: company.color }}>
        {company.symbol} <span className="muted">{company.name}</span>
      </h3>
      {quote ? (
        <>
          <p className="price">${quote.price.toFixed(2)}</p>
          <p className={up ? 'change up' : 'change down'}>
            {up ? '▲' : '▼'} {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
          </p>
        </>
      ) : (
        <p className="muted">No data</p>
      )}
    </article>
  );
}

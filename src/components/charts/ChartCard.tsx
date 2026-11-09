import type { ReactNode } from 'react';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  status: 'loading' | 'error' | 'success';
  error?: Error;
  onRetry?: () => void;
  /** Rendered only when status is "success". */
  children: ReactNode;
}

/** Frame for any chart. Owns the title and the loading / error states. */
export function ChartCard({ title, subtitle, status, error, onRetry, children }: ChartCardProps) {
  return (
    <section className="card chart-card" aria-label={title}>
      <header>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      {status === 'loading' && <LoadingState />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Something went wrong.'} onRetry={onRetry} />
      )}
      {status === 'success' && children}
    </section>
  );
}

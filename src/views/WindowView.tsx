import { COMPANIES, SYMBOLS } from '../config/companies';
import { ChartCard } from '../components/charts/ChartCard';
import { ComparisonLineChart } from '../components/charts/ComparisonLineChart';
import { RankingTable } from '../components/ranking/RankingTable';
import { isStale } from '../domain/session';
import type { Series, TimeWindow } from '../domain/types';
import { useHistory } from '../hooks/useHistory';

interface WindowViewProps {
  window: TimeWindow;
  title: string;
  subtitle: string;
  /** Optional per-series transform applied before charting (e.g. last session only). */
  prepare?: (series: Series[]) => Series[];
  /** Injectable clock for the stale-data notice. */
  now?: () => number;
}

/** Shared body of the three window views: comparison chart plus ranking table. */
export function WindowView({ window, title, subtitle, prepare, now = Date.now }: WindowViewProps) {
  const history = useHistory(SYMBOLS, window);
  const series = history.status === 'success' ? (prepare ? prepare(history.data) : history.data) : [];
  const stale = window === 'day' && history.status === 'success' && isStale(series, now());

  return (
    <div className="window-view">
      <ChartCard
        title={title}
        subtitle={subtitle}
        status={history.status}
        error={history.status === 'error' ? history.error : undefined}
        onRetry={history.retry}
      >
        {stale && (
          <p role="note" className="notice">
            Market closed. Showing the last trading session.
          </p>
        )}
        <ComparisonLineChart series={series} companies={COMPANIES} window={window} />
      </ChartCard>

      {history.status === 'success' && (
        <section className="card" aria-label="Ranking">
          <h2>Ranking</h2>
          <RankingTable series={series} />
        </section>
      )}
    </div>
  );
}

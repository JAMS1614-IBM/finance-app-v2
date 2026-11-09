import { WindowTabs } from '../components/layout/WindowTabs';
import { QuoteGrid } from '../components/summary/QuoteGrid';
import { useTimeWindow } from '../hooks/useTimeWindow';
import { QuarterView } from '../views/QuarterView';
import { TodayView } from '../views/TodayView';
import { WeekView } from '../views/WeekView';

export function DashboardPage() {
  const [window, setWindow] = useTimeWindow();

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Market Dashboard</h1>
        <p className="muted">IBM vs. competitors</p>
      </header>

      <QuoteGrid />

      <WindowTabs value={window} onChange={setWindow} />

      {window === 'day' && <TodayView />}
      {window === '7d' && <WeekView />}
      {window === 'quarter' && <QuarterView />}
    </main>
  );
}

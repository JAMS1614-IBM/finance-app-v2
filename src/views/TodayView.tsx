import { lastSession } from '../domain/session';
import { WindowView } from './WindowView';

export function TodayView() {
  return (
    <WindowView
      window="day"
      title="Relative performance: Current Day"
      subtitle="Latest trading session, percent change from the open"
      prepare={(series) => series.map((s) => ({ ...s, points: lastSession(s.points) }))}
    />
  );
}

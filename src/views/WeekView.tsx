import { WindowView } from './WindowView';

export function WeekView() {
  return (
    <WindowView
      window="7d"
      title="Relative performance: Last 7 Days"
      subtitle="Percent change from the start of the week"
    />
  );
}

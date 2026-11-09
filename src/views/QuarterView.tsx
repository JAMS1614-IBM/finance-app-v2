import { WindowView } from './WindowView';

export function QuarterView() {
  return (
    <WindowView
      window="quarter"
      title="Relative performance: Last Quarter"
      subtitle="Daily closes, percent change from the start of the quarter"
    />
  );
}

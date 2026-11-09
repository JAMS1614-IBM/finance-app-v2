import type { TimeWindow } from '../../domain/types';
import { TIME_WINDOWS } from '../../domain/timeWindows';

interface WindowTabsProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

export function WindowTabs({ value, onChange }: WindowTabsProps) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.id}
          type="button"
          role="tab"
          aria-selected={value === w.id}
          className={value === w.id ? 'tab active' : 'tab'}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}

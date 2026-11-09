import type { TimeWindow } from './types';

export const TIME_WINDOWS: { id: TimeWindow; label: string }[] = [
  { id: 'day', label: 'Current Day' },
  { id: '7d', label: 'Last 7 Days' },
  { id: 'quarter', label: 'Last Quarter' },
];

export function windowLabel(window: TimeWindow): string {
  return TIME_WINDOWS.find((w) => w.id === window)?.label ?? window;
}

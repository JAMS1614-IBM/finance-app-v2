import { useCallback, useEffect, useState } from 'react';
import type { TimeWindow } from '../domain/types';
import { TIME_WINDOWS } from '../domain/timeWindows';

const DEFAULT_WINDOW: TimeWindow = 'day';

function readWindow(): TimeWindow {
  const value = new URLSearchParams(globalThis.location.search).get('window');
  return TIME_WINDOWS.some((w) => w.id === value) ? (value as TimeWindow) : DEFAULT_WINDOW;
}

/** Active time window, mirrored in the URL (?window=) so views are linkable. */
export function useTimeWindow(): [TimeWindow, (window: TimeWindow) => void] {
  const [window, setWindowState] = useState<TimeWindow>(readWindow);

  useEffect(() => {
    const onPop = () => setWindowState(readWindow());
    globalThis.addEventListener('popstate', onPop);
    return () => globalThis.removeEventListener('popstate', onPop);
  }, []);

  const setWindow = useCallback((next: TimeWindow) => {
    const url = new URL(globalThis.location.href);
    url.searchParams.set('window', next);
    globalThis.history.pushState(null, '', url);
    setWindowState(next);
  }, []);

  return [window, setWindow];
}

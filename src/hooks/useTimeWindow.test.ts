import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { windowLabel } from '../domain/timeWindows';
import { useTimeWindow } from './useTimeWindow';

beforeEach(() => globalThis.history.replaceState(null, '', '/'));

describe('windowLabel', () => {
  it('returns the label for each window', () => {
    expect(windowLabel('day')).toBe('Current Day');
    expect(windowLabel('7d')).toBe('Last 7 Days');
    expect(windowLabel('quarter')).toBe('Last Quarter');
  });
});

describe('useTimeWindow', () => {
  it('defaults to the current day', () => {
    const { result } = renderHook(() => useTimeWindow());
    expect(result.current[0]).toBe('day');
  });

  it('starts from a valid ?window= value (deep link)', () => {
    globalThis.history.replaceState(null, '', '/?window=quarter');
    const { result } = renderHook(() => useTimeWindow());
    expect(result.current[0]).toBe('quarter');
  });

  it('ignores an invalid ?window= value', () => {
    globalThis.history.replaceState(null, '', '/?window=year');
    const { result } = renderHook(() => useTimeWindow());
    expect(result.current[0]).toBe('day');
  });

  it('updates state and the URL when the window changes', () => {
    const { result } = renderHook(() => useTimeWindow());
    act(() => result.current[1]('7d'));
    expect(result.current[0]).toBe('7d');
    expect(globalThis.location.search).toBe('?window=7d');
  });

  it('follows the browser back button', () => {
    const { result } = renderHook(() => useTimeWindow());
    act(() => result.current[1]('7d'));
    act(() => {
      globalThis.history.replaceState(null, '', '/?window=quarter');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current[0]).toBe('quarter');
  });
});

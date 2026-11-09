import { cloneElement, type ReactElement } from 'react';

/**
 * jsdom has no layout, so the real ResponsiveContainer measures 0x0 and Recharts
 * draws nothing. This stand-in gives the chart a fixed size so lines actually render.
 * Usage at the top of a test file: vi.mock('recharts', mockRecharts)
 */
export async function mockRecharts(importOriginal: () => Promise<typeof import('recharts')>) {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
      cloneElement(children, { width: 800, height: 320 }),
  };
}

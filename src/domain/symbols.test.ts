import { describe, expect, it } from 'vitest';
import { parseSymbol } from './symbols';

describe('parseSymbol', () => {
  it('trims and upper-cases valid input', () => {
    expect(parseSymbol('  nvda ')).toEqual({ ok: true, symbol: 'NVDA' });
    expect(parseSymbol('brk.b')).toEqual({ ok: true, symbol: 'BRK.B' });
  });

  it('rejects empty and whitespace-only input', () => {
    expect(parseSymbol('')).toMatchObject({ ok: false });
    expect(parseSymbol('   ')).toMatchObject({ ok: false });
  });

  it('rejects digits, spaces and symbols outside the allowed set', () => {
    for (const bad of ['IBM1', '123', 'AB CD', 'IBM$', 'TOOLONGSYMBOL']) {
      const result = parseSymbol(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/ticker/i);
    }
  });
});

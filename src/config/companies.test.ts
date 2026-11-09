import { describe, expect, it } from 'vitest';
import { COMPANIES, MAX_COMPANIES, SYMBOLS, defineCompanies } from './companies';

const co = (symbol: string, primary = false) => ({ symbol, name: symbol, color: '#000', primary });

describe('defineCompanies', () => {
  it('accepts one primary company plus competitors', () => {
    const list = [co('IBM', true), co('MSFT')];
    expect(defineCompanies(list)).toBe(list);
  });

  it('rejects an empty list', () => {
    expect(() => defineCompanies([])).toThrow(/at least one/i);
  });

  it('rejects more than the maximum instead of silently dropping extras', () => {
    const list = [co('IBM', true), ...Array.from({ length: MAX_COMPANIES }, (_, i) => co(`C${i}`))];
    expect(() => defineCompanies(list)).toThrow(/at most/i);
  });

  it('rejects duplicate symbols', () => {
    expect(() => defineCompanies([co('IBM', true), co('IBM')])).toThrow(/duplicate/i);
  });

  it('requires exactly one primary company', () => {
    expect(() => defineCompanies([co('IBM'), co('MSFT')])).toThrow(/primary/i);
    expect(() => defineCompanies([co('IBM', true), co('MSFT', true)])).toThrow(/primary/i);
  });
});

describe('configured companies', () => {
  it('are valid, led by IBM, and exposed as SYMBOLS in the same order', () => {
    expect(COMPANIES[0]).toMatchObject({ symbol: 'IBM', primary: true });
    expect(SYMBOLS).toEqual(COMPANIES.map((c) => c.symbol));
    expect(COMPANIES.length).toBeLessThanOrEqual(MAX_COMPANIES);
  });
});

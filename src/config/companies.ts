import type { Company } from '../domain/types';

/** IBM plus up to four competitors, per the lab brief. */
export const MAX_COMPANIES = 5;

/**
 * Validates a company list. Fails loudly at startup rather than silently
 * dropping or mis-rendering entries.
 */
export function defineCompanies(companies: Company[]): Company[] {
  if (companies.length === 0) throw new Error('At least one company is required.');
  if (companies.length > MAX_COMPANIES) {
    throw new Error(`At most ${MAX_COMPANIES} companies are supported (got ${companies.length}).`);
  }
  const symbols = new Set<string>();
  for (const c of companies) {
    if (symbols.has(c.symbol)) throw new Error(`Duplicate company symbol: ${c.symbol}`);
    symbols.add(c.symbol);
  }
  if (companies.filter((c) => c.primary).length !== 1) {
    throw new Error('Exactly one company must be marked primary.');
  }
  return companies;
}

/**
 * Single source of truth for tracked companies.
 * To add a company: append one entry here (and drop another if already at the limit).
 * Nothing else in the app, the proxy, or the data layer needs to change.
 */
export const COMPANIES: Company[] = defineCompanies([
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe', primary: true },
  { symbol: 'MSFT', name: 'Microsoft', color: '#198038' },
  { symbol: 'ORCL', name: 'Oracle', color: '#da1e28' },
  { symbol: 'SAP', name: 'SAP', color: '#8a3ffc' },
  { symbol: 'CRM', name: 'Salesforce', color: '#b28600' },
]);

export const SYMBOLS: string[] = COMPANIES.map((c) => c.symbol);

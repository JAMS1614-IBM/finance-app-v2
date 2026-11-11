/** Shared by the browser mock service and the server's request validation. */
export const SYMBOL_PATTERN = /^[A-Z.\-^]{1,10}$/;

export type ParsedSymbol = { ok: true; symbol: string } | { ok: false; message: string };

/** Normalises user input (trim, upper-case) and checks it against SYMBOL_PATTERN. */
export function parseSymbol(input: string): ParsedSymbol {
  const symbol = input.trim().toUpperCase();
  if (!symbol) return { ok: false, message: 'Enter a ticker symbol (e.g. NVDA).' };
  if (!SYMBOL_PATTERN.test(symbol)) {
    return { ok: false, message: "Ticker must be 1–10 characters: letters, '.', '-' or '^' (e.g. NVDA, BRK.B)." };
  }
  return { ok: true, symbol };
}


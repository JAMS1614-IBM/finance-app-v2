import { z } from 'zod';
import { SYMBOL_PATTERN } from '../src/domain/symbols';

export const MAX_SYMBOLS_PER_REQUEST = 10;

const symbols = z
  .string()
  .min(1, 'symbols is required')
  .transform((value) => value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))
  .pipe(
    z
      .array(z.string().regex(SYMBOL_PATTERN, 'Invalid symbol'))
      .min(1, 'At least one symbol is required')
      .max(MAX_SYMBOLS_PER_REQUEST, `At most ${MAX_SYMBOLS_PER_REQUEST} symbols per request`),
  );

export const quotesQuery = z.object({ symbols });

export const historyQuery = z.object({
  symbols,
  window: z.enum(['day', '7d', 'quarter']),
});

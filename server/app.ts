import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { MarketDataError, type MarketDataErrorCode } from '../src/services/errors';
import type { MarketDataService } from '../src/services/marketDataService';
import { historyQuery, quotesQuery } from './validation';

const STATUS: Record<MarketDataErrorCode, number> = {
  INVALID_SYMBOL: 400,
  UPSTREAM_UNAVAILABLE: 502,
  NETWORK: 503,
};

type Handler = (req: Request, res: Response) => Promise<void>;

/** Express 5 forwards rejected promises to the error handler, but this keeps the intent explicit. */
const route = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};

export function createApp(service: MarketDataService) {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get(
    '/api/quotes',
    route(async (req, res) => {
      const { symbols } = quotesQuery.parse(req.query);
      res.json({ data: await service.getQuotes(symbols) });
    }),
  );

  app.get(
    '/api/history',
    route(async (req, res) => {
      const { symbols, window } = historyQuery.parse(req.query);
      res.json({ data: await service.getHistory(symbols, window) });
    }),
  );

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route' } });
  });

  // Four-argument signature is what marks this as an Express error handler.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    if (error instanceof ZodError) {
      res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: error.issues.map((i) => i.message).join('; ') },
      });
    } else if (error instanceof MarketDataError) {
      res.status(STATUS[error.code]).json({ error: { code: error.code, message: error.message } });
    } else {
      console.error(error);
      res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error' } });
    }
  });

  return app;
}

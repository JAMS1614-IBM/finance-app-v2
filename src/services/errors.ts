export type MarketDataErrorCode = 'INVALID_SYMBOL' | 'UPSTREAM_UNAVAILABLE' | 'NETWORK';

export class MarketDataError extends Error {
  readonly code: MarketDataErrorCode;

  constructor(code: MarketDataErrorCode, message: string) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
  }
}

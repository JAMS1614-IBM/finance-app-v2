# Architecture

A React dashboard comparing IBM with up to four competitors across three time windows
(current day, last 7 days, last quarter). Read this before changing code. It is written for
humans and for Bob.

## Data flow

```
React UI  ->  hooks  ->  MarketDataService  ->  HTTP  ->  Express proxy  ->  Yahoo Finance
(components)  (src/hooks) (interface)   (/api/*)   (server/)     (yahoo-finance2)
```

The browser never calls Yahoo directly. Yahoo's endpoints are unofficial and block browser
requests, so all upstream access goes through the proxy in `server/`.

## Layers and dependency rules

| Folder | Role | May import |
|---|---|---|
| `src/domain/` | Pure types and logic: normalization, ranking, session detection | nothing |
| `src/config/` | Tracked companies (single source of truth) | `domain` |
| `src/services/` | `MarketDataService` interface and its implementations (HTTP, mock) | `domain` |
| `src/hooks/` | Data fetching and UI state (`useHistory`, `useQuotes`, `useTimeWindow`) | `services`, `domain` |
| `src/components/` | Presentational components. Never fetch data themselves | `domain`, `config` |
| `src/views/`, `src/pages/` | Compose hooks and components into screens | all of `src` |
| `server/` | Express proxy, Yahoo provider, cache, request validation | `src/domain`, `src/services` types |

Components must not import from `services/` directly. Go through a hook.

## Key abstractions

- **`MarketDataService`** (`src/services/marketDataService.ts`): `getQuotes` and `getHistory`.
  The UI only depends on this interface. Implementations: `httpMarketDataService` (browser to
  proxy), `mockMarketDataService` (seeded sample data), and on the server
  `createYahooMarketDataService` (wraps a narrow `YahooClient`).
- **`MarketDataError`** (`src/services/errors.ts`): typed errors with a `code`
  (`INVALID_SYMBOL`, `UPSTREAM_UNAVAILABLE`, `NETWORK`). The proxy maps codes to HTTP
  statuses (400, 502, 503) and returns `{ error: { code, message } }`.
- **`ChartCard`** (`src/components/charts/ChartCard.tsx`): frame for any chart. It owns the
  title and the loading and error states with Retry. Put new charts inside it.
- **`WindowView`** (`src/views/WindowView.tsx`): chart plus ranking table. `TodayView`,
  `WeekView` and `QuarterView` are thin configurations of it.

## Behavior worth knowing

- **Comparison** is percent change from the first point of each series, so companies with
  different prices share one axis (`domain/normalize.ts`).
- **Current day** fetches five days of 5-minute bars and keeps only the latest session
  (`domain/session.ts`). On weekends and holidays the view shows "Market closed" and the last
  session.
- **Partial failure**: if some symbols fail upstream, the proxy returns an empty series for
  them and the rest still render. It only errors when every symbol fails.
- **Caching**: the proxy caches quotes for 30 s and history for 2 min. Errors are not cached.
- **State**: no global store. Server data lives in hooks, and the active window lives in the
  URL (`?window=`).

## How to extend

| Task | Change |
|---|---|
| Add or remove a company | Edit `src/config/companies.ts` only. One entry: `{ symbol, name, color }`. `defineCompanies` fails at startup if there are more than 5, duplicates, or not exactly one `primary` (IBM). The proxy and data layer accept any valid ticker, so nothing else changes |
| Add a chart | New component inside `ChartCard`, fed by `useHistory` |
| Add a user-selected company graph | New `SymbolPicker` and chart reusing `useHistory([symbol], window)`; validation already exists server-side (`server/validation.ts`) |
| Change data vendor | New `MarketDataService` implementation on the server, wired in `server/index.ts` |
| Change window definitions | `YAHOO_WINDOWS` in `server/providers/yahooProvider.ts` and `domain/timeWindows.ts` |

## Running and validating

```bash
npm install
npm run dev:mock        # UI only, sample data, no server
npm run dev             # API proxy (:3001) and UI (:5173) together, live Yahoo Finance
npm run dev:server      # proxy only
npm run dev:ui          # UI only; proxies /api to :3001 (needs the proxy running)
npm run validate        # lint, typecheck, tests, build (what CI runs); see VALIDATION.md
npm run smoke:yahoo     # manual live check; not run in CI
```

`MARKET_DATA_PROVIDER=mock npm run dev:server` runs the proxy on sample data.

Tests never touch the network. They use the mock service or injected fakes.

## GitHub workflow

1. Open an issue with the feature request template (`.github/ISSUE_TEMPLATE/`).
2. Branch from `main`: `feature/<slug>`, `fix/<slug>` or `bob/<slug>`. CI runs on all three.
3. Implement against the interfaces above and add tests.
4. Run `npm run validate` before pushing.
5. Open a PR using the template and link the issue (`Closes #N`).
6. A maintainer merges after CI passes.

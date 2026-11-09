# Validation guide

How to check the finance dashboard locally, and what a passing result looks like.
Run everything from the repo root.

## One command

```bash
npm run validate
```

Runs lint, typecheck, tests and a production build, stopping at the first failure. This is the
same sequence CI runs, so if it passes locally, CI should pass.

## The individual checks

| Command | What it checks | Success looks like |
|---|---|---|
| `npm run lint` | ESLint rules for TypeScript and React hooks | No output, exit code 0 |
| `npm run typecheck` | TypeScript strict mode across `src/`, `server/`, `scripts/` | No output, exit code 0 |
| `npm test` | All unit, component and API tests (no network) | `Test Files 12 passed`, `Tests 76 passed` (counts grow as you add tests) |
| `npm run test:coverage` | Same tests plus coverage thresholds | A coverage summary, and no `ERROR: Coverage ... does not meet threshold` line |
| `npm run build` | Typecheck, then a production Vite build | `built in ...ms` and a `dist/` folder |

For a quick edit loop, run `npx vitest` (watch mode) in a second terminal.

## What the tests cover

| Area | Files | What is verified |
|---|---|---|
| Data transformation | `src/domain/*.test.ts` | Rebasing to percent change, dropping bad points, sorting, merging series with gaps, ranking and tie-breaks, latest-session detection, stale-data detection |
| Company config | `src/config/companies.test.ts` | Max of 5, no duplicates, exactly one primary company |
| Data services | `src/services/*.test.ts` | Mock data is repeatable and rejects bad symbols; the HTTP client turns server errors, network failures and an unreachable server into typed errors |
| Yahoo provider | `server/providers/yahooProvider.test.ts` | Field mapping, null prices, per-window interval and lookback, one failing symbol does not fail the rest, tickers outside the config work |
| API | `server/app.test.ts`, `server/cache.test.ts` | Input validation, error-to-HTTP-status mapping, hidden internals on 500, cache expiry |
| UI rendering | `src/App.test.tsx`, `src/components/**/*.test.tsx`, `src/hooks/*.test.ts` | Quote cards, rankings, all three windows, tab switching and the URL, loading and error states with Retry, the market-closed notice, one chart line per company |

Chart tests replace Recharts' `ResponsiveContainer` with a fixed-size stand-in
(`src/test/mockRecharts.tsx`), because jsdom has no layout and would otherwise draw nothing.

## Coverage thresholds

Set in `vite.config.ts` and enforced by `npm run test:coverage`:

- `src/domain/**`: at least 90% statements, 85% branches, 90% functions, 90% lines
- `server/**`: at least 85% statements and lines

`npm run validate` does not run coverage, to keep it fast. Run `test:coverage` before opening a PR.

## Running the app

```bash
npm run dev:mock    # sample data, no server
npm run dev         # live Yahoo Finance: API server (:3001) and UI (:5173)
```

**Success looks like:**

1. For `npm run dev`, the terminal shows both `[api] Market data proxy listening on http://localhost:3001 (provider: yahoo)` and `[ui] Local: http://localhost:5173/`.
2. The page shows five quote cards (IBM, MSFT, ORCL, SAP, CRM) with prices.
3. Each tab (Current Day, Last 7 Days, Last Quarter) shows a chart with five lines and a ranking table of five rows.
4. On a weekend or holiday, Current Day shows "Market closed. Showing the last trading session."
5. The browser URL changes to `?window=7d` or `?window=quarter` when you switch tabs.

## Live data check (manual, not in CI)

```bash
npm run smoke:yahoo
```

Calls the real Yahoo Finance API for every tracked company and window.
**Success:** three tables of quotes and point counts, and `Smoke check passed`.
Run it when you change `server/providers/` or suspect Yahoo has changed. It can fail from rate
limiting or a network problem without any code being wrong, so a failure here is not a CI blocker.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Dashboard shows "Market data service is unreachable (HTTP 502)" | The API server is not running. Use `npm run dev`, not `npm run dev:ui` |
| `npm run dev` exits with "Port 5173 is already in use" | An old Vite is still running. `pkill -f vite`, then retry |
| `Missing script: "..."` | Use a script from the table above. Run `npm run` to list them |
| Tests pass locally but CI fails | Run `npm ci` instead of `npm install` to match CI's exact dependency versions |

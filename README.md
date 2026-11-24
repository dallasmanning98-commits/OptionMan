# OptionMan

A market-research dashboard for a six-stock watchlist (NVDA, TSLA, PLTR, AMD, AAPL, COIN). It turns a daily quote snapshot into research labels, mover alerts and data-quality warnings, so the numbers are easy to scan and their limits are obvious.

> Research tool only. Signals are labels for further study, not investment advice or trade recommendations.

## Features

- **Watchlist cards:** price, change vs. prior close, volume and relative volume for each symbol.
- **Research labels:** each stock is tagged `BUY WATCH`, `HOLD` or `TRIM / SELL WATCH`, with a confidence level, catalyst notes and risk notes.
- **Mover alerts:** flags any symbol that moves 10% or more from the prior close.
- **Market tone meter:** summarizes the watchlist's average move as risk-on, risk-off or mixed.
- **Trading-window guide:** grades each part of the session by liquidity and noise.
- **Data-quality guardrails:** shows the quote source, quote time and known limitations, and warns when the snapshot is stale during market hours.
- **Filters and search:** by symbol, movers, buy-watch or sell-watch.

## How it works

```text
quote snapshot (public/data/optionman-latest.json)
  -> client fetch every 60 s with validation
  -> derived metrics (tone, movers, signal counts, staleness)
  -> React dashboard
```

Relative volume is today's volume divided by the average of the previous four sessions. Quotes come from a public chart endpoint and may be delayed.

## Tech

Next.js and React (TypeScript) on the [vinext](https://github.com/cloudflare/vinext) runtime, with optional Cloudflare D1 + Drizzle ORM. Node's built-in test runner checks the rendered HTML.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev     # local development
npm test        # build and run rendered-HTML tests
```

## Project structure

```text
app/            dashboard page, layout and styles
public/data/    latest and historical quote snapshots
db/, drizzle/   optional D1 database schema
tests/          rendered-HTML tests
worker/         edge worker entry point
```

## Author

Dallas E. Manning

"use client";

import { useEffect, useMemo, useState } from "react";

type Signal = "BUY WATCH" | "HOLD" | "TRIM / SELL WATCH";
type Confidence = "low" | "medium" | "high";

type StockQuote = {
  symbol: string;
  price: number;
  previousClose: number;
  percentChange: number;
  extendedHoursPercentChange: number | null;
  volume: number;
  relativeVolume: number | null;
  mover10Percent: boolean;
  signal: Signal;
  confidence: Confidence;
  catalyst: string;
  riskNotes: string;
  optionsResearch: string;
};

type MarketSnapshot = {
  schemaVersion: number;
  generatedAt: string;
  quoteAsOf: string;
  timezone: string;
  market: {
    venue: string;
    status: "open" | "closed";
    regularHours: string;
    calendarVerified: boolean;
  };
  watchlist: StockQuote[];
  alerts: {
    thresholdPercent: number;
    count: number;
    symbols: string[];
    message: string;
  };
  dataQuality: {
    quoteSource: string;
    relativeVolumeMethod: string;
    extendedHours: string;
    limitations: string[];
  };
};

const companyNames: Record<string, string> = {
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  PLTR: "Palantir",
  AMD: "Advanced Micro Devices",
  AAPL: "Apple",
  COIN: "Coinbase",
};

const windows = [
  { time: "9:30-10:00", grade: "C", note: "High noise and wide spreads. Observe." },
  { time: "10:00-11:30", grade: "A", note: "Best balance of liquidity and confirmed direction." },
  { time: "11:30-2:00", grade: "C+", note: "Lower volume. Avoid forcing options entries." },
  { time: "2:00-3:30", grade: "B+", note: "Useful for trend continuation and position entries." },
  { time: "3:30-4:00", grade: "B-", note: "Liquid, but overnight risk rises quickly." },
];

const dateTime = (value: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
}).format(new Date(value));

export default function Home() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "movers" | "buy" | "sell">("all");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState(2);

  useEffect(() => {
    let active = true;

    const loadSnapshot = async () => {
      try {
        const response = await fetch(`/data/optionman-latest.json?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
        const next = await response.json() as MarketSnapshot;
        if (!next.generatedAt || !next.quoteAsOf || !Array.isArray(next.watchlist)) {
          throw new Error("Market data is incomplete");
        }
        if (active) {
          setSnapshot(next);
          setDataError(null);
        }
      } catch (error) {
        if (active) {
          setSnapshot(null);
          setDataError(error instanceof Error ? error.message : "Market data is unavailable");
        }
      }
    };

    void loadSnapshot();
    const refreshTimer = window.setInterval(loadSnapshot, 60_000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const stocks = snapshot?.watchlist ?? [];
  const visible = useMemo(() => stocks.filter((stock) => {
    const matchesQuery = `${stock.symbol} ${companyNames[stock.symbol] ?? stock.symbol}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" ||
      (filter === "movers" && stock.mover10Percent) ||
      (filter === "buy" && stock.signal === "BUY WATCH") ||
      (filter === "sell" && stock.signal === "TRIM / SELL WATCH");
    return matchesQuery && matchesFilter;
  }), [filter, query, stocks]);

  const averageMove = stocks.length > 0
    ? stocks.reduce((total, stock) => total + stock.percentChange, 0) / stocks.length
    : 0;
  const marketTone = averageMove > 0.75 ? "Risk-on" : averageMove < -0.75 ? "Risk-off" : "Mixed";
  const meterWidth = Math.max(10, Math.min(90, 50 + averageMove * 8));
  const buyWatches = stocks.filter((stock) => stock.signal === "BUY WATCH").length;
  const riskFlags = stocks.filter((stock) => stock.signal === "TRIM / SELL WATCH").length;
  const snapshotAgeMinutes = snapshot
    ? Math.max(0, (Date.now() - new Date(snapshot.generatedAt).getTime()) / 60_000)
    : 0;
  const staleDuringOpen = snapshot?.market.status === "open" && snapshotAgeMinutes > 90;
  const optionsLabel = (value: string) => value.startsWith("NO SETUP") ? "No verified setup" : value;

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="mark">OM</span><div><strong>OptionMan</strong><small>US Market Intelligence</small></div></div>
        <div className="market">
          <span className={`live-dot ${snapshot?.market.status === "closed" ? "closed-dot" : ""}`} />
          US MARKET <b>{snapshot?.market.status?.toUpperCase() ?? "CHECKING"}</b>
          <span>{snapshot ? `Quotes ${dateTime(snapshot.quoteAsOf)}` : "Loading verified snapshot"}</span>
        </div>
        <button className="ghost" type="button">Research mode</button>
      </header>

      <section className={`data-strip ${dataError || staleDuringOpen ? "data-alert" : ""}`} aria-live="polite">
        {dataError ? (
          <strong>DATA UNAVAILABLE - {dataError}. No fallback prices are being shown.</strong>
        ) : snapshot ? (
          <>
            <strong>{snapshot.market.status === "closed" ? "LAST REGULAR CLOSE" : staleDuringOpen ? "STALE OPEN-MARKET DATA" : "VERIFIED SNAPSHOT"}</strong>
            <span>Quotes as of {dateTime(snapshot.quoteAsOf)}</span>
            <span>Research refreshed {dateTime(snapshot.generatedAt)}</span>
            <span>{snapshot.dataQuality.quoteSource}</span>
          </>
        ) : <strong>Loading verified market data...</strong>}
      </section>

      <section className="hero">
        <div>
          <p className="eyebrow">US WATCHLIST COMMAND CENTER {snapshot ? `- ${dateTime(snapshot.generatedAt)}` : ""}</p>
          <h1>Find the move.<br /><em>Control the risk.</em></h1>
          <p className="lede">OptionMan tracks the configured US watchlist, flags absolute moves of 10% or more, and separates verified prices from research signals.</p>
        </div>
        <div className="pulse-card">
          <span>WATCHLIST PULSE</span><strong>{snapshot ? marketTone : "Waiting"}</strong><div className="meter"><i style={{ width: `${meterWidth}%` }} /></div>
          <div className="pulse-stats"><p><b>{snapshot?.alerts.count ?? 0}</b><small>10% movers</small></p><p><b>{buyWatches}</b><small>buy watches</small></p><p><b>{riskFlags}</b><small>risk flags</small></p></div>
        </div>
      </section>

      <section className="controls">
        <div className="search"><span aria-hidden="true">?</span><input aria-label="Filter watchlist" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter the verified watchlist..." /></div>
        <div className="tabs" role="tablist" aria-label="Signal filters">
          {(["all", "movers", "buy", "sell"] as const).map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All positions" : item === "movers" ? "+/-10% movers" : `${item} watch`}</button>)}
        </div>
      </section>

      <section className="main-grid">
        <div className="panel watchlist">
          <div className="panel-head"><div><span>WATCHLIST</span><h2>Verified signal board</h2></div><small>{visible.length} symbols - timestamped feed</small></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Asset</th><th>Price</th><th>Move vs close</th><th>Rel. vol.</th><th>Confidence</th><th>Research signal</th><th>Catalyst / risk</th><th>Options research</th></tr></thead>
            <tbody>{visible.map((stock) => <tr key={stock.symbol}>
              <td><b>{stock.symbol}</b><small>{companyNames[stock.symbol] ?? stock.symbol}</small></td>
              <td><b>${stock.price.toFixed(2)}</b><small>Prior ${stock.previousClose.toFixed(2)}</small></td>
              <td className={stock.percentChange >= 0 ? "up" : "down"}>{stock.percentChange > 0 ? "+" : ""}{stock.percentChange.toFixed(2)}% {stock.mover10Percent && <sup>10%+</sup>}</td>
              <td title={`${stock.volume.toLocaleString("en-US")} shares`}>{stock.relativeVolume === null ? "N/A" : `${stock.relativeVolume.toFixed(2)}x`}</td>
              <td><span className={`confidence confidence-${stock.confidence}`}>{stock.confidence}</span></td>
              <td><span className={`signal ${stock.signal.startsWith("BUY") ? "buy" : stock.signal.startsWith("TRIM") ? "sell" : "hold"}`}>{stock.signal}</span></td>
              <td className="data-note" title={stock.riskNotes}>{stock.catalyst}</td>
              <td className="data-note" title={stock.optionsResearch}>{optionsLabel(stock.optionsResearch)}</td>
            </tr>)}</tbody>
          </table></div>
          {!dataError && snapshot && visible.length === 0 && <p className="empty">No verified symbols match this view.</p>}
          {dataError && <p className="empty data-error">OptionMan will not substitute sample prices when the feed fails.</p>}
        </div>

        <aside className="panel risk-card">
          <span>RISK DESK</span><h2>Position guardrail</h2><p>Set the maximum account risk for one research idea.</p>
          <div className="risk-value"><strong>{risk}%</strong><small>maximum risk</small></div>
          <input aria-label="Maximum account risk percentage" type="range" min="0.5" max="5" step="0.5" value={risk} onChange={(e) => setRisk(Number(e.target.value))} />
          <div className="risk-examples"><p><span>$10K account</span><b>${(10000 * risk / 100).toFixed(0)}</b></p><p><span>$25K account</span><b>${(25000 * risk / 100).toFixed(0)}</b></p><p><span>$50K account</span><b>${(50000 * risk / 100).toFixed(0)}</b></p></div>
          <div className="warning">OptionMan does not place trades. Confirm every quote, catalyst, signal, and contract with your broker before acting.</div>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="panel"><div className="panel-head"><div><span>GENERAL RESEARCH RHYTHM</span><h2>When to trade</h2></div></div>
          <div className="days">{[
            ["MON", "B-", "Let price discovery settle"], ["TUE", "A", "Best trend confirmation"], ["WED", "A-", "Good entries; watch macro events"], ["THU", "B+", "Manage theta and expiry risk"], ["FRI", "C+", "Reduce new short-dated exposure"]
          ].map(([day, grade, note]) => <div key={day} className={grade === "A" ? "best" : ""}><b>{day}</b><strong>{grade}</strong><small>{note}</small></div>)}</div>
        </div>
        <div className="panel"><div className="panel-head"><div><span>INTRADAY GUIDANCE - EASTERN</span><h2>Time windows</h2></div></div>
          <div className="windows">{windows.map((window) => <div key={window.time}><b>{window.time}</b><span>{window.grade}</span><small>{window.note}</small></div>)}</div>
        </div>
      </section>

      <footer><span>OPTIONMAN / RESEARCH SYSTEM v0.2</span><p>Timestamped delayed data - Not investment advice - Options involve substantial risk</p></footer>
    </main>
  );
}

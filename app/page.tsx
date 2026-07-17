"use client";

import { useMemo, useState } from "react";

type Signal = "BUY WATCH" | "HOLD" | "TRIM / SELL WATCH";
type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  score: number;
  signal: Signal;
  setup: string;
};

const stocks: Stock[] = [
  { symbol: "NVDA", name: "NVIDIA", price: 183.42, change: 12.6, volume: "2.1×", score: 86, signal: "BUY WATCH", setup: "Call spread · 30–45 DTE" },
  { symbol: "TSLA", name: "Tesla", price: 318.09, change: -11.3, volume: "1.8×", score: 38, signal: "TRIM / SELL WATCH", setup: "Put spread · defined risk" },
  { symbol: "PLTR", name: "Palantir", price: 148.71, change: 10.4, volume: "1.6×", score: 77, signal: "HOLD", setup: "Wait for pullback" },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 166.28, change: -6.8, volume: "1.3×", score: 63, signal: "BUY WATCH", setup: "Shares first · calls later" },
  { symbol: "AAPL", name: "Apple", price: 211.46, change: 2.1, volume: "0.9×", score: 68, signal: "HOLD", setup: "No options edge" },
  { symbol: "COIN", name: "Coinbase", price: 392.15, change: 14.2, volume: "2.7×", score: 72, signal: "TRIM / SELL WATCH", setup: "Protective put · 21–30 DTE" },
];

const windows = [
  { time: "9:30–10:00", grade: "C", note: "High noise and wide spreads. Observe." },
  { time: "10:00–11:30", grade: "A", note: "Best balance of liquidity and confirmed direction." },
  { time: "11:30–2:00", grade: "C+", note: "Lower volume. Avoid forcing options entries." },
  { time: "2:00–3:30", grade: "B+", note: "Useful for trend continuation and position entries." },
  { time: "3:30–4:00", grade: "B−", note: "Liquid, but overnight risk rises quickly." },
];

export default function Home() {
  const [filter, setFilter] = useState<"all" | "movers" | "buy" | "sell">("all");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState(2);
  const [added, setAdded] = useState<string[]>([]);

  const visible = useMemo(() => stocks.filter((stock) => {
    const matchesQuery = `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" ||
      (filter === "movers" && Math.abs(stock.change) >= 10) ||
      (filter === "buy" && stock.signal === "BUY WATCH") ||
      (filter === "sell" && stock.signal === "TRIM / SELL WATCH");
    return matchesQuery && matchesFilter;
  }), [filter, query]);

  const addTicker = () => {
    const ticker = query.trim().toUpperCase();
    if (ticker && !added.includes(ticker)) setAdded([...added, ticker]);
    setQuery("");
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="mark">OM</span><div><strong>OptionMan</strong><small>US Market Intelligence</small></div></div>
        <div className="market"><span className="live-dot" /> US MARKET <b>OPEN</b><span>Next close 4:00 PM ET</span></div>
        <button className="ghost">Research mode</button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">MORNING COMMAND CENTER · JUL 16, 2026</p>
          <h1>Find the move.<br /><em>Control the risk.</em></h1>
          <p className="lede">OptionMan ranks your US watchlist, flags ±10% movers, and turns momentum into disciplined research setups.</p>
        </div>
        <div className="pulse-card">
          <span>MARKET PULSE</span><strong>Risk-on</strong><div className="meter"><i /></div>
          <div className="pulse-stats"><p><b>18</b><small>movers</small></p><p><b>7</b><small>buy watches</small></p><p><b>4</b><small>risk flags</small></p></div>
        </div>
      </section>

      <section className="controls">
        <div className="search"><span>⌕</span><input aria-label="Search or add ticker" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTicker()} placeholder="Search or add ticker…" /><button onClick={addTicker}>Add</button></div>
        <div className="tabs" role="tablist" aria-label="Signal filters">
          {(["all", "movers", "buy", "sell"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All positions" : item === "movers" ? "±10% movers" : `${item} watch`}</button>)}
        </div>
      </section>

      {added.length > 0 && <div className="added">Queued for live data connection: {added.map((ticker) => <span key={ticker}>{ticker}</span>)}</div>}

      <section className="main-grid">
        <div className="panel watchlist">
          <div className="panel-head"><div><span>WATCHLIST</span><h2>Signal board</h2></div><small>{visible.length} symbols · sample feed</small></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Asset</th><th>Price</th><th>Move</th><th>Vol.</th><th>Score</th><th>Research signal</th><th>Options setup</th></tr></thead>
            <tbody>{visible.map((stock) => <tr key={stock.symbol}>
              <td><b>{stock.symbol}</b><small>{stock.name}</small></td><td>${stock.price.toFixed(2)}</td>
              <td className={stock.change >= 0 ? "up" : "down"}>{stock.change > 0 ? "+" : ""}{stock.change}% {Math.abs(stock.change) >= 10 && <sup>10%+</sup>}</td>
              <td>{stock.volume}</td><td><span className="score">{stock.score}</span></td>
              <td><span className={`signal ${stock.signal.startsWith("BUY") ? "buy" : stock.signal.startsWith("TRIM") ? "sell" : "hold"}`}>{stock.signal}</span></td><td>{stock.setup}</td>
            </tr>)}</tbody>
          </table></div>
          {visible.length === 0 && <p className="empty">No symbols match this view.</p>}
        </div>

        <aside className="panel risk-card">
          <span>RISK DESK</span><h2>Position guardrail</h2><p>Set the maximum account risk for one research idea.</p>
          <div className="risk-value"><strong>{risk}%</strong><small>maximum risk</small></div>
          <input aria-label="Maximum account risk percentage" type="range" min="0.5" max="5" step="0.5" value={risk} onChange={(e) => setRisk(Number(e.target.value))} />
          <div className="risk-examples"><p><span>$10K account</span><b>${(10000 * risk / 100).toFixed(0)}</b></p><p><span>$25K account</span><b>${(25000 * risk / 100).toFixed(0)}</b></p><p><span>$50K account</span><b>${(50000 * risk / 100).toFixed(0)}</b></p></div>
          <div className="warning">OptionMan does not place trades. Confirm every setup, price, catalyst, and contract before acting.</div>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="panel"><div className="panel-head"><div><span>WEEKLY RHYTHM</span><h2>When to trade</h2></div></div>
          <div className="days">{[
            ["MON", "B−", "Let price discovery settle"], ["TUE", "A", "Best trend confirmation"], ["WED", "A−", "Good entries; watch Fed events"], ["THU", "B+", "Manage theta and expiry risk"], ["FRI", "C+", "Reduce new short-dated exposure"]
          ].map(([day, grade, note]) => <div key={day} className={grade === "A" ? "best" : ""}><b>{day}</b><strong>{grade}</strong><small>{note}</small></div>)}</div>
        </div>
        <div className="panel"><div className="panel-head"><div><span>INTRADAY EDGE · EASTERN</span><h2>Time windows</h2></div></div>
          <div className="windows">{windows.map((window) => <div key={window.time}><b>{window.time}</b><span>{window.grade}</span><small>{window.note}</small></div>)}</div>
        </div>
      </section>

      <footer><span>OPTIONMAN / RESEARCH SYSTEM v0.1</span><p>Illustrative data only · Not investment advice · Options involve substantial risk</p></footer>
    </main>
  );
}

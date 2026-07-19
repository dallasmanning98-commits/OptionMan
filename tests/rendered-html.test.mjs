import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the OptionMan dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>OptionMan - US Market Intelligence<\/title>/i);
  assert.match(html, /Find the move/);
  assert.match(html, /Loading verified market data/);
  assert.doesNotMatch(html, /sample feed|Illustrative data only/i);
});

test("uses the generated snapshot instead of embedded demonstration quotes", async () => {
  const [page, rawSnapshot] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/data/optionman-latest.json", import.meta.url), "utf8"),
  ]);
  const snapshot = JSON.parse(rawSnapshot);

  assert.match(page, /fetch\(`\/data\/optionman-latest\.json/);
  assert.match(page, /No fallback prices are being shown/);
  assert.doesNotMatch(page, /price:\s*183\.42|price:\s*318\.09|const stocks:\s*Stock\[\]/);

  assert.equal(snapshot.schemaVersion, 1);
  assert.ok(Date.parse(snapshot.generatedAt));
  assert.ok(Date.parse(snapshot.quoteAsOf));
  assert.equal(snapshot.market.status, "closed");
  assert.deepEqual(snapshot.watchlist.map(({ symbol }) => symbol), ["NVDA", "TSLA", "PLTR", "AMD", "AAPL", "COIN"]);

  for (const quote of snapshot.watchlist) {
    assert.equal(typeof quote.price, "number");
    assert.equal(typeof quote.previousClose, "number");
    assert.equal(typeof quote.percentChange, "number");
    const calculated = ((quote.price - quote.previousClose) / quote.previousClose) * 100;
    assert.ok(Math.abs(calculated - quote.percentChange) < 0.001, `${quote.symbol} move must match price and prior close`);
  }
});

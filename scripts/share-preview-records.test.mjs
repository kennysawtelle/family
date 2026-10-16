import assert from "node:assert/strict";
import test from "node:test";

import worker from "../_worker.js";

const env = {
  ASSETS: {
    fetch: async () => new Response("<!doctype html><html><head><title>Fallback</title></head><body></body></html>", {
      headers: { "content-type": "text/html; charset=UTF-8" },
    }),
  },
};

test("game share metadata includes both current records", async () => {
  const url = new URL("https://family.example/game");
  url.searchParams.set("team", "North Alabama");
  url.searchParams.set("opponent", "Little Rock");
  url.searchParams.set("ha", "Away");
  url.searchParams.set("record", "5-3-4");
  url.searchParams.set("oppRecord", "3-5-4");
  const html = await (await worker.fetch(new Request(url), env)).text();

  assert.match(html, /North Alabama \(5-3-4\) at Little Rock \(3-5-4\)/);
  assert.match(html, /North Alabama 5-3-4 · Little Rock 3-5-4/);
});

test("team share metadata includes the current record", async () => {
  const url = new URL("https://family.example/team");
  url.searchParams.set("name", "Bonita");
  url.searchParams.set("sport", "Varsity Football");
  url.searchParams.set("record", "7-0");
  const html = await (await worker.fetch(new Request(url), env)).text();

  assert.match(html, /Bonita \(7-0\) \| Sawtelle Family Sports/);
  assert.match(html, /Current record 7-0/);
});

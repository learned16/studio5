import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.mjs";

test("worker sends the root request to the static index", async () => {
  let requestedPath = null;
  const response = await worker.fetch(
    new Request("https://studio5.example/"),
    {
      ASSETS: {
        async fetch(request) {
          requestedPath = new URL(request.url).pathname;
          return new Response(
            await readFile(new URL("../index.html", import.meta.url), "utf8"),
            { headers: { "content-type": "text/html; charset=utf-8" } },
          );
        },
      },
    },
  );
  assert.equal(requestedPath, "/index.html");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /id="ink-canvas"/);
});

test("Service Worker precaches the extracted transform module under a new cache", async () => {
  const source = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(source, /studio5-notebook-gate-v5-ink-transforms/);
  assert.match(source, /"\.\/ink-coordinate-transforms\.mjs"/);
  assert.match(source, /"\.\/core\/lecture-inbox\.mjs"/);
  assert.match(source, /"\.\/core\/backup\.mjs"/);
  assert.match(source, /keys\.filter\(\(key\) => key !== CACHE_NAME\)/);
  assert.match(source, /self\.skipWaiting\(\)/);
  assert.match(source, /self\.clients\.claim\(\)/);
});

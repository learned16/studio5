import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import worker from "../worker/index.mjs";

const SERVICE_WORKER_URL = new URL("../sw.js", import.meta.url);

async function createServiceWorkerHarness(initialCacheNames = []) {
  const source = await readFile(SERVICE_WORKER_URL, "utf8");
  const listeners = new Map();
  const cacheStores = new Map(initialCacheNames.map((name) => [name, new Map()]));
  const deletedCaches = [];
  const precachedAssets = [];
  let online = true;
  let skipWaitingCalls = 0;
  let claimCalls = 0;
  let networkCalls = 0;

  const requestKey = (request) => typeof request === "string" ? request : request.url;
  const caches = {
    async open(name) {
      if (!cacheStores.has(name)) cacheStores.set(name, new Map());
      const entries = cacheStores.get(name);
      return {
        async addAll(assets) {
          precachedAssets.push(...assets);
          for (const asset of assets) {
            entries.set(asset, new Response(`precache:${asset}`));
          }
        },
        async put(request, response) {
          entries.set(requestKey(request), response.clone());
        },
      };
    },
    async keys() {
      return [...cacheStores.keys()];
    },
    async delete(name) {
      deletedCaches.push(name);
      return cacheStores.delete(name);
    },
    async match(request) {
      const key = requestKey(request);
      for (const entries of cacheStores.values()) {
        const response = entries.get(key);
        if (response) return response.clone();
      }
      return undefined;
    },
  };

  runInNewContext(source, {
    caches,
    fetch: async (request) => {
      networkCalls += 1;
      if (!online) throw new Error("offline");
      return new Response(`network:${requestKey(request)}`);
    },
    self: {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      skipWaiting() {
        skipWaitingCalls += 1;
      },
      clients: {
        claim() {
          claimCalls += 1;
          return Promise.resolve();
        },
      },
    },
  });

  async function dispatch(type, event = {}) {
    let completion = Promise.resolve();
    let response;
    listeners.get(type)({
      ...event,
      waitUntil(promise) {
        completion = Promise.resolve(promise);
      },
      respondWith(promise) {
        response = Promise.resolve(promise);
      },
    });
    await completion;
    return response ? response : undefined;
  }

  return {
    cacheStores,
    deletedCaches,
    precachedAssets,
    dispatch,
    setOnline(value) { online = value; },
    counters() {
      return { skipWaitingCalls, claimCalls, networkCalls };
    },
  };
}

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

test("Service Worker uses the scoped P0 cache namespace", async () => {
  const source = await readFile(SERVICE_WORKER_URL, "utf8");
  assert.match(source, /const CACHE_PREFIX = "studio5-notebook-gate-"/);
  assert.match(source, /const CACHE_NAME = `\$\{CACHE_PREFIX\}v5-ink-transforms`/);
  assert.match(source, /"\.\/ink-coordinate-transforms\.mjs"/);
  assert.match(source, /"\.\/core\/lecture-inbox\.mjs"/);
  assert.match(source, /"\.\/core\/backup\.mjs"/);
  assert.match(source, /self\.skipWaiting\(\)/);
  assert.match(source, /self\.clients\.claim\(\)/);
});

test("Service Worker install precaches the complete shell and activates immediately", async () => {
  const harness = await createServiceWorkerHarness();
  await harness.dispatch("install");
  assert.ok(harness.precachedAssets.includes("./ink-coordinate-transforms.mjs"));
  assert.ok(harness.precachedAssets.includes("./core/lecture-inbox.mjs"));
  assert.ok(harness.precachedAssets.includes("./core/backup.mjs"));
  assert.equal(harness.counters().skipWaitingCalls, 1);
});

test("Service Worker activate deletes only old P0 caches", async () => {
  const oldP0Cache = "studio5-notebook-gate-v4-before-transforms";
  const currentP0Cache = "studio5-notebook-gate-v5-ink-transforms";
  const unrelatedCache = "studio5-p3-experimental-cache";
  const harness = await createServiceWorkerHarness([
    oldP0Cache,
    currentP0Cache,
    unrelatedCache,
  ]);

  await harness.dispatch("activate");

  assert.deepEqual(harness.deletedCaches, [oldP0Cache]);
  assert.equal(harness.cacheStores.has(oldP0Cache), false);
  assert.equal(harness.cacheStores.has(currentP0Cache), true);
  assert.equal(harness.cacheStores.has(unrelatedCache), true);
  assert.equal(harness.counters().claimCalls, 1);
});

test("Service Worker reopens a fetched asset from cache after going offline", async () => {
  const harness = await createServiceWorkerHarness();
  await harness.dispatch("install");
  const request = new Request("https://studio5.example/runtime-asset.mjs");

  const onlineResponse = await harness.dispatch("fetch", { request });
  assert.equal(await onlineResponse.text(), `network:${request.url}`);
  assert.equal(harness.counters().networkCalls, 1);

  harness.setOnline(false);
  const offlineResponse = await harness.dispatch("fetch", { request });
  assert.equal(await offlineResponse.text(), `network:${request.url}`);
  assert.equal(harness.counters().networkCalls, 1);
});

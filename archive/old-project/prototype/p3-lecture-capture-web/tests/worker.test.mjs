import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.mjs";

test("worker routes root requests to index.html", async () => {
  let routedPath = null;
  const env = {
    ASSETS: {
      fetch(request) {
        routedPath = new URL(request.url).pathname;
        return new Response("ok");
      },
    },
  };

  const response = await worker.fetch(new Request("https://example.test/"), env);
  assert.equal(routedPath, "/index.html");
  assert.equal(await response.text(), "ok");
});

test("worker routes closeout directory requests to its isolated index", async () => {
  let routedPath = null;
  const env = {
    ASSETS: {
      fetch(request) {
        routedPath = new URL(request.url).pathname;
        return new Response("closeout");
      },
    },
  };

  const response = await worker.fetch(
    new Request("https://example.test/closeout/"),
    env,
  );
  assert.equal(routedPath, "/closeout/index.html");
  assert.equal(await response.text(), "closeout");
});

test("worker routes library directory requests to its isolated index", async () => {
  let routedPath = null;
  const env = {
    ASSETS: {
      fetch(request) {
        routedPath = new URL(request.url).pathname;
        return new Response("library");
      },
    },
  };
  const response = await worker.fetch(
    new Request("https://example.test/library/"),
    env,
  );
  assert.equal(routedPath, "/library/index.html");
  assert.equal(await response.text(), "library");
});

test("worker routes reliability directory requests to its isolated index", async () => {
  let routedPath = null;
  const env = {
    ASSETS: {
      fetch(request) {
        routedPath = new URL(request.url).pathname;
        return new Response("reliability");
      },
    },
  };
  const response = await worker.fetch(
    new Request("https://example.test/reliability/"),
    env,
  );
  assert.equal(routedPath, "/reliability/index.html");
  assert.equal(await response.text(), "reliability");
});

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

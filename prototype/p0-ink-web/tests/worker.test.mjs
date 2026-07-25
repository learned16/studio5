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

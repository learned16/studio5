import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "../serve.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const [html, css, app] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../app.mjs", import.meta.url), "utf8"),
]);
const source = `${html}\n${css}\n${app}`;

test("the primary navigation contains exactly five approved destinations", () => {
  const destinations = [...html.matchAll(/data-destination="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(destinations, ["today", "study", "projects", "practice", "library"]);
});

test("all five destination labels are present", () => {
  for (const label of ["Today", "Study", "Projects", "Practice", "Library"]) {
    assert.match(html, new RegExp(`>${label}<`));
  }
});

test("AI chat is not a primary destination", () => {
  const primaryNavigation = html.match(/<nav class="primary-navigation"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.doesNotMatch(primaryNavigation, /\b(?:AI|chat|assistant|copilot)\b/i);
});

test("Unified Workspace and all requested modes exist", () => {
  assert.match(app, /Unified Workspace/);
  for (const mode of ["Read", "Annotate", "Notes", "Canvas", "Split"]) {
    assert.match(app, new RegExp(`"${mode}"`));
  }
});

test("Arabic and mixed-language examples use dir auto", () => {
  assert.match(app, /dir="auto"[^>]*>[^<]*[\u0600-\u06ff]/u);
  assert.match(app, /dir="auto"/);
});

test("the prototype has no external dependencies or CDN links", () => {
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(html, /<script[^>]+src="(?:\/\/|https?:)/i);
  assert.doesNotMatch(html, /<link[^>]+href="(?:\/\/|https?:)/i);
  assert.doesNotMatch(source, /(?:from|import)\s*[('"`]\s*(?!\.\.?\/|node:)[a-z@]/i);
});

test("accessibility essentials are represented", () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
});

let server;
let baseUrl;

before(async () => {
  server = createStaticServer();
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
});

test("the prototype opens from a static HTTP server", async () => {
  const indexResponse = await fetch(`${baseUrl}/`);
  const moduleResponse = await fetch(`${baseUrl}/app.mjs`);
  const styleResponse = await fetch(`${baseUrl}/styles.css`);

  assert.equal(indexResponse.status, 200);
  assert.match(indexResponse.headers.get("content-type"), /text\/html/);
  assert.match(await indexResponse.text(), /Warm Paper Academic Studio/);
  assert.equal(moduleResponse.status, 200);
  assert.match(moduleResponse.headers.get("content-type"), /text\/javascript/);
  assert.equal(styleResponse.status, 200);
  assert.match(styleResponse.headers.get("content-type"), /text\/css/);
});

test("test fixture stays inside the standalone prototype root", () => {
  assert.match(root.replaceAll("\\", "/"), /prototype\/p45-warm-paper-shell\/$/);
});

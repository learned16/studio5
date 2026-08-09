import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { destinations } from "../routes.mjs";
import { destinationView } from "../views.mjs";

const root = new URL("..", import.meta.url);
const [html, css, app, fallback, packageManifest] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("app.mjs", root), "utf8"),
  readFile(new URL("404.html", root), "utf8"),
  readFile(new URL("package.json", root), "utf8"),
]);

test("shell stays English LTR while representative user content uses automatic direction", () => {
  assert.match(html, /<html lang="en" dir="ltr">/);
  const views = destinations.map(({ id }) => destinationView(id)).join("");
  assert.match(views, /dir="auto"[^>]*>[\s\S]{0,80}[\u0600-\u06ff]/u);
  assert.doesNotMatch(html, /dir="rtl"/);
});

test("responsive navigation exposes a rail and a five-column bottom bar", () => {
  assert.equal((html.match(/data-navigation/g) ?? []).length, 2);
  assert.match(css, /\.navigation-rail\s*\{/);
  assert.match(css, /\.bottom-navigation\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(5,/);
  assert.match(css, /@media \(max-width: 63\.99rem\)/);
});

test("keyboard and non-color accessibility states remain explicit", () => {
  assert.match(app, /ArrowDown/);
  assert.match(app, /aria-current/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(destinationView("practice"), /Unavailable/);
  assert.match(destinationView("practice"), /disabled/);
  assert.match(destinationView("study"), /empty-state/);
});

test("Practice is a disabled shell state and does not implement Phase 5", () => {
  const practice = destinationView("practice");
  assert.match(practice, /Drawing Coach is not started/);
  assert.match(practice, /Phase 5 data are intentionally absent/);
  assert.match(practice, /<button[^>]*disabled/);
  assert.doesNotMatch(practice, /<canvas|data-exercise|data-assessment/i);
});

test("surface remains dependency-free and isolated", () => {
  const manifest = JSON.parse(packageManifest);
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.devDependencies, undefined);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(app, /p0-ink-web|p3-lecture-capture-web|studio5-core/);
  assert.match(fallback, /routeFromPathname/);
});

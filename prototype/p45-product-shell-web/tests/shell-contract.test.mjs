import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

import { destinations } from "../routes.mjs";
import { destinationView } from "../views.mjs";

const root = new URL("..", import.meta.url);
const [html, css, app, fallback, packageManifest, builtSmoke] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("app.mjs", root), "utf8"),
  readFile(new URL("404.html", root), "utf8"),
  readFile(new URL("package.json", root), "utf8"),
  readFile(new URL("scripts/built-smoke.mjs", root), "utf8"),
]);

async function surfaceSourceFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    if (["dist", "node_modules", "tests"].includes(entry.name)) return [];
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return surfaceSourceFiles(entryUrl);
    return /\.(?:css|html|mjs)$/.test(entry.name) ? [entryUrl] : [];
  }));
  return nestedFiles.flat();
}

function withoutLocalHttpUrls(source) {
  return source.replace(/http:\/\/(?:localhost|127\.0\.0\.1)(?::(?:\d+|\$\{[^}]+\}))?/g, "");
}

function moduleSpecifiers(source) {
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*(?:\(\s*)?["']([^"']+)["']/g,
  ];
  return patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));
}

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

test("presentation colors outside the token registry use semantic variables", () => {
  const cssWithoutTokenRegistry = css.replace(/:root\s*\{[\s\S]*?\}/, "");
  assert.match(css, /--color-bg-navigation:/);
  assert.match(css, /--color-text-on-primary:/);
  assert.doesNotMatch(
    cssWithoutTokenRegistry,
    /(?:color|background(?:-color)?|border(?:-[^:]+)?):[^;]*(?:#[\da-f]{3,8}|\b(?:white|black)\b)/i,
  );
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

test("built smoke executes navigation instead of treating URL fragments as HTTP evidence", () => {
  assert.doesNotMatch(builtSmoke, /fetch\([^)]*#\//);
  assert.match(builtSmoke, /await import\(new URL\("\.\.\/dist\/assets\/app\.mjs"/);
  assert.match(builtSmoke, /aria-current/);
  assert.match(builtSmoke, /focusedHeading/);
});

test("Practice is a disabled shell state and does not implement Phase 5", () => {
  const practice = destinationView("practice");
  assert.match(practice, /Drawing Coach is not started/);
  assert.match(practice, /Phase 5 data are intentionally absent/);
  assert.match(practice, /<button[^>]*disabled/);
  assert.doesNotMatch(practice, /<canvas|data-exercise|data-assessment/i);
});

test("all surface sources remain dependency-free and isolated", async () => {
  const manifest = JSON.parse(packageManifest);
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.devDependencies, undefined);
  const sourceFiles = await surfaceSourceFiles();
  assert.ok(sourceFiles.length > 0);
  for (const sourceFile of sourceFiles) {
    const source = await readFile(sourceFile, "utf8");
    const bareImports = moduleSpecifiers(source)
      .filter((specifier) => !specifier.startsWith(".") && !specifier.startsWith("node:"));
    assert.deepEqual(bareImports, [], `${sourceFile.pathname}: bare import`);
    assert.doesNotMatch(withoutLocalHttpUrls(source), /https?:\/\//, `${sourceFile.pathname}: external URL`);
    assert.doesNotMatch(
      source,
      /p0-ink-web|p3-lecture-capture-web|p45-warm-paper-shell|packages\/studio5-core|@studio5\/core/,
      `${sourceFile.pathname}: cross-surface reference`,
    );
  }
  const repositoryFiles = await readdir(root, { recursive: true });
  assert.equal(
    repositoryFiles.some((path) => /(?:^|[\\/])(?:pnpm-lock\.yaml|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|bun\.lockb?|deno\.lock)$/.test(path)),
    false,
  );
  assert.match(fallback, /routeFromPathname/);
});

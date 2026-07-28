import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("library uses the internal canvas PDF viewer instead of an iframe", async () => {
  const [html, app, viewer, css, serviceWorker] = await Promise.all([
    readFile(new URL("library/index.html", root), "utf8"),
    readFile(new URL("library/app.mjs", root), "utf8"),
    readFile(new URL("library/pdf-viewer.mjs", root), "utf8"),
    readFile(new URL("library/styles.css", root), "utf8"),
    readFile(new URL("sw.js", root), "utf8"),
  ]);

  assert.doesNotMatch(html, /<iframe[^>]+id="pdf-viewer"/);
  assert.match(html, /id="pdf-viewer"[\s\S]*id="pdf-canvas"/);
  assert.match(html, /id="pdf-previous"/);
  assert.match(html, /id="pdf-next"/);
  assert.match(html, /id="pdf-zoom-out"/);
  assert.match(html, /id="pdf-zoom-in"/);
  assert.match(html, /id="pdf-fit"/);
  assert.match(app, /createPdfViewer/);
  assert.match(app, /state\.viewer\.open\(opened\.content\.bytes\)/);
  assert.match(viewer, /getDocument/);
  assert.match(viewer, /pdf\.worker\.min\.mjs/);
  assert.match(viewer, /renderCurrentPage/);
  assert.match(viewer, /MAX_PIXEL_RATIO = 2/);
  assert.match(css, /\.pdf-page-stage\s*\{[\s\S]*overflow:\s*auto/);
  assert.match(serviceWorker, /studio5-p4-reliability-v2/);
  assert.match(serviceWorker, /vendor\/pdfjs\/pdf\.min\.mjs/);
});

test("pinned PDF.js dependency and license are present locally", async () => {
  const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(packageJson.dependencies["pdfjs-dist"], "6.1.200");
  await access(new URL("node_modules/pdfjs-dist/LICENSE", root));
  await access(new URL("node_modules/pdfjs-dist/legacy/build/pdf.min.mjs", root));
  await access(new URL("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", root));
});

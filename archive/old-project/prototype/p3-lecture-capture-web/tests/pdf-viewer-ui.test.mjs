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
  assert.match(css, /#pdf-canvas\s*\{[\s\S]*direction:\s*ltr\s*;/);
  assert.match(serviceWorker, /studio5-p4-storage-v3/);
  assert.match(serviceWorker, /vendor\/pdfjs\/pdf\.min\.mjs/);
});

test("PDF canvas direction is LTR after intrinsic sizing and before PDF.js render", async () => {
  const viewer = await readFile(new URL("library/pdf-viewer.mjs", root), "utf8");
  const widthIndex = viewer.indexOf("canvas.width = Math.max");
  const heightIndex = viewer.indexOf("canvas.height = Math.max");
  const directionIndex = viewer.indexOf('context.direction = "ltr";');
  const renderIndex = viewer.indexOf("renderTask = page.render");

  assert.notEqual(widthIndex, -1);
  assert.notEqual(heightIndex, -1);
  assert.notEqual(directionIndex, -1);
  assert.notEqual(renderIndex, -1);
  assert.ok(widthIndex < heightIndex);
  assert.ok(heightIndex < directionIndex);
  assert.ok(directionIndex < renderIndex);
});

test("PDF.js assets and viewer navigation contracts remain unchanged", async () => {
  const [html, viewer, serviceWorker] = await Promise.all([
    readFile(new URL("library/index.html", root), "utf8"),
    readFile(new URL("library/pdf-viewer.mjs", root), "utf8"),
    readFile(new URL("sw.js", root), "utf8"),
  ]);

  assert.match(viewer, /\.\.\/vendor\/pdfjs\/pdf\.worker\.min\.mjs/);
  assert.match(viewer, /\.\.\/vendor\/pdfjs\/cmaps\//);
  assert.match(viewer, /\.\.\/vendor\/pdfjs\/standard_fonts\//);
  assert.match(viewer, /\.\.\/vendor\/pdfjs\/wasm\//);
  assert.match(viewer, /\.\.\/vendor\/pdfjs\/iccs\//);
  assert.doesNotMatch(viewer, /disableFontFace|useSystemFonts/);
  assert.match(serviceWorker, /vendor\/pdfjs\/pdf\.worker\.min\.mjs/);

  for (const id of [
    "pdf-previous",
    "pdf-next",
    "pdf-zoom-out",
    "pdf-zoom-in",
    "pdf-fit",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(viewer, /previousButton\.addEventListener\("click"/);
  assert.match(viewer, /nextButton\.addEventListener\("click"/);
  assert.match(viewer, /zoomOutButton\.addEventListener\("click"/);
  assert.match(viewer, /zoomInButton\.addEventListener\("click"/);
  assert.match(viewer, /fitButton\.addEventListener\("click", fitWidth\)/);
});

test("pinned PDF.js dependency and license are present locally", async () => {
  const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(packageJson.dependencies["pdfjs-dist"], "6.1.200");
  await access(new URL("node_modules/pdfjs-dist/LICENSE", root));
  await access(new URL("node_modules/pdfjs-dist/legacy/build/pdf.min.mjs", root));
  await access(new URL("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", root));
});

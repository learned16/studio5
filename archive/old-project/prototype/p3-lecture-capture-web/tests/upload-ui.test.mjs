import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("PDF picker is a visible native control and upload waits for selection", async () => {
  const [html, css, app, serviceWorker] = await Promise.all([
    readFile(new URL("library/index.html", root), "utf8"),
    readFile(new URL("library/styles.css", root), "utf8"),
    readFile(new URL("library/app.mjs", root), "utf8"),
    readFile(new URL("sw.js", root), "utf8"),
  ]);

  assert.match(html, /id="pdf-file"[\s\S]*type="file"/);
  assert.doesNotMatch(html, /id="pdf-file"[\s\S]{0,180}accept=/);
  assert.match(html, /id="upload-submit"[\s\S]*disabled/);
  assert.match(css, /\.native-file-field input\[type="file"\]\s*\{[\s\S]*position:\s*static;/);
  assert.match(css, /\.native-file-field input\[type="file"\]\s*\{[\s\S]*opacity:\s*1;/);
  assert.match(css, /\.native-file-field input\[type="file"\]\s*\{[\s\S]*pointer-events:\s*auto;/);
  assert.doesNotMatch(css, /\.file-picker input/);
  assert.match(app, /pdfFile\.addEventListener\("change", updateFileSelection\)/);
  assert.match(app, /uploadSubmit\.disabled = false/);
  assert.match(app, /file\.name/);
  assert.match(serviceWorker, /studio5-p4-storage-v3/);
  assert.match(serviceWorker, /fetch\(event\.request\)[\s\S]*\.catch\(\(\) => caches\.match/);
});

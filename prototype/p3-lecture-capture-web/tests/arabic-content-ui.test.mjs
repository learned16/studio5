import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createUserTextElement,
  setUserText,
} from "../user-content.mjs";

const root = new URL("../", import.meta.url);
const examples = [
  "محاضرة مواد البناء.pdf",
  "الرسم الهندسي الأول.pdf",
  "محاضرة 03 - Building Materials.pdf",
  "مشروع البيت السكني - Final v2.pdf",
  "ملاحظة عن المسقط والواجهة",
  "صفحة 2 — Section and Elevation",
  "Building Materials 03.pdf",
];

function fakeDocument() {
  return {
    createElement(tagName) {
      const classes = new Set();
      return {
        tagName,
        textContent: "",
        attributes: new Map(),
        classes,
        setAttribute(name, value) {
          this.attributes.set(name, value);
        },
        classList: {
          add: (...names) => names.forEach(name => classes.add(name)),
        },
      };
    },
  };
}

test("user text keeps its original Unicode value and receives an automatic bidi context", () => {
  const document = fakeDocument();
  for (const example of examples) {
    const element = createUserTextElement(document, example);
    assert.equal(element.textContent, example);
    assert.equal(element.attributes.get("dir"), "auto");
    assert.ok(element.classes.has("user-content"));
  }
});

test("setUserText does not reshape or normalize Arabic and mixed content", () => {
  const element = fakeDocument().createElement("strong");
  const original = "مشروع البيت السكني - Final v2.pdf";
  assert.equal(setUserText(element, original), original);
  assert.equal(element.textContent, original);
});

test("P3 user-content CSS prevents letter spacing and aggressive character wrapping", async () => {
  const styles = await Promise.all([
    "styles.css",
    "closeout/styles.css",
    "library/styles.css",
    "reliability/styles.css",
  ].map(path => readFile(new URL(path, root), "utf8")));

  for (const css of styles) {
    assert.match(css, /\.user-content,[\s\S]*letter-spacing:\s*normal/);
    assert.match(css, /\.user-content,[\s\S]*text-align:\s*start/);
    assert.match(css, /\.user-content,[\s\S]*unicode-bidi:\s*plaintext/);
    assert.match(css, /\.user-content,[\s\S]*overflow-wrap:\s*break-word/);
    assert.doesNotMatch(
      css,
      /\.user-content[^{]*\{[^}]*overflow-wrap:\s*anywhere/,
    );
  }
});

test("Capture, Closeout, Library, and Reliability mark user HTML content as auto direction", async () => {
  const [capture, closeout, library, reliability, libraryHtml, captureHtml, closeoutHtml] =
    await Promise.all([
      readFile(new URL("app.mjs", root), "utf8"),
      readFile(new URL("closeout/app.mjs", root), "utf8"),
      readFile(new URL("library/app.mjs", root), "utf8"),
      readFile(new URL("reliability/app.mjs", root), "utf8"),
      readFile(new URL("library/index.html", root), "utf8"),
      readFile(new URL("index.html", root), "utf8"),
      readFile(new URL("closeout/index.html", root), "utf8"),
    ]);

  assert.match(capture, /setUserText\(content, capture\.text\)/);
  assert.match(closeout, /setUserText\(text, item\.capture\.text\)/);
  assert.match(library, /setUserText\(title, note\.title\)/);
  assert.match(library, /setUserText\(body, note\.body\)/);
  assert.match(library, /\{ userContent: true \}/);
  assert.match(reliability, /setUserText\([\s\S]*elements\.selectedBackup/);
  assert.match(libraryHtml, /id="note-title"[^>]*dir="auto"/);
  assert.match(libraryHtml, /id="note-body"[^>]*dir="auto"/);
  assert.match(captureHtml, /id="capture-text"[\s\S]{0,120}dir="auto"/);
  assert.match(closeoutHtml, /id="task-title"[^>]*dir="auto"/);
});

test("HTML content rendering and PDF canvas rendering remain separate surfaces", async () => {
  const [library, viewer] = await Promise.all([
    readFile(new URL("library/app.mjs", root), "utf8"),
    readFile(new URL("library/pdf-viewer.mjs", root), "utf8"),
  ]);

  assert.match(library, /setUserText\(elements\.selectedFile/);
  assert.match(viewer, /page\.render\(\{[\s\S]*canvasContext:\s*context/);
  assert.match(viewer, /cMapUrl/);
  assert.match(viewer, /standardFontDataUrl/);
  assert.doesNotMatch(viewer, /setUserText|arabic.*reshape/i);
});

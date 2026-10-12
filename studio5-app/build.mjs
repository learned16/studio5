// Concatenates src/ into one self-contained page: dist/studio5.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const order = ["core.js", "curriculum.js", "ink.js", "pdf.js", "ai.js", "ui.js", "tools.js",
  "view-today.js", "view-study.js", "view-projects.js", "view-practice.js", "view-library.js",
  "view-system.js", "main.js"];
const read = (f) => readFileSync(new URL("./src/" + f, import.meta.url), "utf8");
const js = order.map((f) => `// ---- ${f} ----\n${read(f)}`).join("\n");
const html = read("head.html")
  + `<style>\n${read("styles.css")}\n</style>\n`
  + read("body.html")
  + `<script>\n"use strict";\n${js}\n</script>\n`;
mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("./dist/studio5.html", import.meta.url), html);
console.log("built dist/studio5.html", (html.length / 1024).toFixed(0) + " KB");

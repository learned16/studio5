import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import {
  extname,
  join,
  normalize,
  resolve,
  sep,
} from "node:path";

const port = Number(process.env.PORT || 4174);
const root = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const coreRoot = join(root, "..", "..", "packages", "studio5-core", "src");
const pdfJsRoot = join(root, "node_modules", "pdfjs-dist");
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let file;
  if (pathname.startsWith("/vendor/pdfjs/")) {
    const relativePdfJsPath = normalize(pathname.slice("/vendor/pdfjs/".length));
    const aliases = {
      "pdf.min.mjs": join("legacy", "build", "pdf.min.mjs"),
      "pdf.worker.min.mjs": join("legacy", "build", "pdf.worker.min.mjs"),
    };
    const pdfJsCandidate = resolve(pdfJsRoot, aliases[relativePdfJsPath] ?? relativePdfJsPath);
    const resolvedPdfJsRoot = resolve(pdfJsRoot);
    if (!pdfJsCandidate.startsWith(`${resolvedPdfJsRoot}${sep}`)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }
    file = pdfJsCandidate;
  } else if (pathname.startsWith("/core/")) {
    const resolvedCoreRoot = resolve(coreRoot);
    const coreCandidate = resolve(
      resolvedCoreRoot,
      normalize(pathname.slice("/core/".length)),
    );
    if (!coreCandidate.startsWith(`${resolvedCoreRoot}${sep}`)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }
    file = coreCandidate;
  } else {
    file = join(root, safePath === "/" ? "index.html" : safePath);
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": types[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Studio5 Lecture Capture: http://127.0.0.1:${port}/`);
});

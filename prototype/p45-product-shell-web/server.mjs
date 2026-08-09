import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 4176);
const root = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

function requestedFile(pathname) {
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(root, safePath === "/" ? "index.html" : safePath.slice(1));
  if (candidate !== root && !candidate.startsWith(`${resolve(root)}${sep}`)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return resolve(root, "404.html");
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = requestedFile(pathname);
  if (!file) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }
  const isFallback = file.endsWith("404.html") && pathname !== "/404.html";
  response.writeHead(isFallback ? 404 : 200, {
    "cache-control": "no-store",
    "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Studio5 Phase 4.5 shell: http://127.0.0.1:${port}/`);
});

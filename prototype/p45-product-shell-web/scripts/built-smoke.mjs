import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";

const assets = new URL("../dist/assets/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

async function builtFile(pathname) {
  const candidate = resolve(assets, pathname === "/" ? "index.html" : pathname.slice(1));
  const candidateRelativePath = relative(assets, candidate);
  if (candidateRelativePath === ".." || candidateRelativePath.startsWith(`..${sep}`)) return null;
  try {
    if ((await stat(candidate)).isFile()) return candidate;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return join(assets, "404.html");
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = await builtFile(pathname);
  if (!file) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const fallback = file.endsWith("404.html") && pathname !== "/404.html";
  response.writeHead(fallback ? 404 : 200, { "content-type": contentTypes[extname(file)] });
  response.end(await readFile(file));
});

await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
try {
  for (const path of ["/", "/index.html", "/styles.css", "/app.mjs", "/routes.mjs", "/views.mjs"]) {
    const response = await fetch(`${origin}${path}`);
    if (!response.ok) throw new Error(`Built asset returned ${response.status}: ${path}`);
  }
  for (const destination of ["today", "study", "projects", "practice", "library"]) {
    const response = await fetch(`${origin}/#/${destination}`);
    if (!response.ok || !(await response.text()).includes("data-navigation")) {
      throw new Error(`Built shell did not load for hash destination: ${destination}`);
    }
  }
  const fallback = await fetch(`${origin}/study`);
  if (fallback.status !== 404 || !(await fallback.text()).includes("routeFromPathname")) {
    throw new Error("Static fallback did not preserve a direct route");
  }
} finally {
  await new Promise((resolveClosing, rejectClosing) => {
    server.close((error) => error ? rejectClosing(error) : resolveClosing());
  });
}

console.log("Built HTTP smoke passed: assets, five hash routes, and static fallback");

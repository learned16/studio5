import { createServer } from "node:http";
import {
  readFile,
  readdir,
  stat,
} from "node:fs/promises";
import {
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const assetsRoot = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const CLOUDFLARE_FREE_FILE_LIMIT = 20_000;
const CLOUDFLARE_FILE_SIZE_LIMIT = 25 * 1024 * 1024;
const requiredRoutes = ["/", "/closeout/", "/library/", "/reliability/"];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".svg", ".webmanifest"]);
const forbiddenNames = new Set([
  ".ds_store",
  ".env",
  ".git",
  ".gitignore",
  ".npmrc",
  ".pnpmfile.cjs",
  "thumbs.db",
]);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:OPENAI|ANTHROPIC|CLOUDFLARE)_(?:API_)?(?:KEY|TOKEN)\s*=\s*\S+/i,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
];

function fail(message) {
  throw new Error(`Static preview verification failed: ${message}`);
}

async function listFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...await listFiles(absolute));
    } else if (entry.isFile()) {
      output.push(absolute);
    }
  }
  return output;
}

function outputPath(absolute) {
  return relative(assetsRoot, absolute).split(sep).join("/");
}

function toAssetPath(reference, sourcePath) {
  if (!reference
    || reference.startsWith("#")
    || /^(?:blob:|data:|mailto:|tel:|https?:)/i.test(reference)) {
    return null;
  }
  const sourceUrl = new URL(`https://preview.invalid/${sourcePath}`);
  const resolved = new URL(reference, sourceUrl);
  let pathname = decodeURIComponent(resolved.pathname).replace(/^\/+/, "");
  if (pathname.endsWith("/")) pathname += "index.html";
  return pathname;
}

function collectReferences(source, sourcePath) {
  const references = [];
  const extension = extname(sourcePath).toLowerCase();
  const patterns = [];
  if (extension === ".html") {
    patterns.push(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi);
  }
  if (extension === ".css") {
    patterns.push(/\burl\(\s*["']?([^"')]+)["']?\s*\)/gi);
  }
  if (extension === ".mjs" || extension === ".js") {
    patterns.push(
      /\bfrom\s*["']([^"']+)["']/g,
      /\bimport\s*["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
      /\bnew URL\(\s*["']([^"']+)["']/g,
    );
  }
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if ((extension === ".mjs" || extension === ".js")
        && !match[1].startsWith(".")
        && !match[1].startsWith("/")) {
        continue;
      }
      const assetPath = toAssetPath(match[1], sourcePath);
      if (assetPath) references.push(assetPath);
    }
  }
  return references;
}

function contentType(pathname) {
  switch (extname(pathname).toLowerCase()) {
    case ".css": return "text/css; charset=utf-8";
    case ".html": return "text/html; charset=utf-8";
    case ".js":
    case ".mjs": return "text/javascript; charset=utf-8";
    case ".json":
    case ".webmanifest": return "application/json; charset=utf-8";
    case ".pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const absolute = resolve(assetsRoot, `.${pathname}`);
      const rootPrefix = `${resolve(assetsRoot)}${sep}`;
      if (absolute !== resolve(assetsRoot) && !absolute.startsWith(rootPrefix)) {
        response.writeHead(400);
        response.end("Bad request");
        return;
      }
      const metadata = await stat(absolute).catch(() => null);
      if (!metadata?.isFile()) {
        response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        response.end(await readFile(join(assetsRoot, "404.html")));
        return;
      }
      response.writeHead(200, { "content-type": contentType(absolute) });
      response.end(await readFile(absolute));
    } catch {
      response.writeHead(500);
      response.end("Internal error");
    }
  });
}

await stat(assetsRoot).catch(() => fail("dist/assets is missing; run the build first"));
const files = await listFiles(assetsRoot);
if (files.length === 0) fail("dist/assets is empty");
if (files.length > CLOUDFLARE_FREE_FILE_LIMIT) {
  fail(`file count ${files.length} exceeds Cloudflare Free limit ${CLOUDFLARE_FREE_FILE_LIMIT}`);
}

let largest = { path: "", size: -1 };
const knownAssets = new Set(files.map(outputPath));
if (!knownAssets.has("404.html")) {
  fail("404.html is missing from the build output root");
}
const sensitiveFiles = [];
const exposedSecrets = [];
const brokenReferences = [];

for (const absolute of files) {
  const path = outputPath(absolute);
  const metadata = await stat(absolute);
  if (metadata.size > largest.size) largest = { path, size: metadata.size };
  if (metadata.size > CLOUDFLARE_FILE_SIZE_LIMIT) {
    fail(`${path} is ${metadata.size} bytes; Cloudflare limit is ${CLOUDFLARE_FILE_SIZE_LIMIT}`);
  }
  const segments = path.toLowerCase().split("/");
  if (segments.some(segment => forbiddenNames.has(segment))
    || /\.(?:key|p12|pfx|pem)$/i.test(path)) {
    sensitiveFiles.push(path);
  }
  if (!textExtensions.has(extname(path).toLowerCase())) continue;
  const source = await readFile(absolute, "utf8");
  if (!path.startsWith("vendor/")) {
    for (const reference of collectReferences(source, path)) {
      const directoryReference = reference.endsWith("/index.html")
        && [...knownAssets].some(asset => asset.startsWith(reference.slice(0, -"index.html".length)));
      if (!knownAssets.has(reference) && !directoryReference) {
        brokenReferences.push(`${path} -> ${reference}`);
      }
    }
  }
  if (metadata.size <= 2 * 1024 * 1024) {
    for (const pattern of secretPatterns) {
      if (pattern.test(source)) exposedSecrets.push(`${path} (${pattern.source})`);
    }
  }
}

if (sensitiveFiles.length > 0) fail(`sensitive/local files found: ${sensitiveFiles.join(", ")}`);
if (exposedSecrets.length > 0) fail(`possible secrets found: ${exposedSecrets.join(", ")}`);
if (brokenReferences.length > 0) fail(`broken local references:\n${brokenReferences.join("\n")}`);

const homeHtml = await readFile(join(assetsRoot, "index.html"), "utf8");
const notFoundHtml = await readFile(join(assetsRoot, "404.html"), "utf8");
if (notFoundHtml === homeHtml) {
  fail("404.html must not contain the home page document");
}
const rootApp = await readFile(join(assetsRoot, "app.mjs"), "utf8");
const libraryViewer = await readFile(join(assetsRoot, "library", "pdf-viewer.mjs"), "utf8");
const serviceWorkerMatch = rootApp.match(/serviceWorker\.register\(\s*["']([^"']+)["']/);
const pdfWorkerMatch = libraryViewer.match(
  /GlobalWorkerOptions\.workerSrc\s*=\s*new URL\(\s*["']([^"']+)["']/,
);
if (!serviceWorkerMatch) fail("root app does not register a Service Worker");
if (!pdfWorkerMatch) fail("PDF worker URL is not defined relative to the viewer module");

const server = createStaticServer();
await new Promise((accept, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", accept);
});

try {
  const address = server.address();
  if (!address || typeof address === "string") fail("could not determine localhost port");
  const baseUrl = new URL(`http://127.0.0.1:${address.port}/`);
  const routeResults = [];
  for (const route of requiredRoutes) {
    const response = await fetch(new URL(route, baseUrl));
    routeResults.push(`${route}:${response.status}`);
    if (response.status !== 200) fail(`${route} returned HTTP ${response.status}`);
  }

  const missingResponse = await fetch(new URL("/missing-static-preview-route", baseUrl));
  if (missingResponse.status !== 404) {
    fail(`missing route returned ${missingResponse.status}; SPA fallback must stay disabled`);
  }
  const missingBody = await missingResponse.text();
  if (missingBody !== notFoundHtml) {
    fail("missing route did not return the root 404.html document");
  }
  if (missingBody === homeHtml) {
    fail("missing route returned the home page instead of 404.html");
  }

  const pdfWorkerUrl = new URL(
    pdfWorkerMatch[1],
    new URL("/library/pdf-viewer.mjs", baseUrl),
  );
  if (pdfWorkerUrl.origin !== baseUrl.origin) fail("PDF worker is not same-origin");
  const pdfWorkerResponse = await fetch(pdfWorkerUrl);
  if (pdfWorkerResponse.status !== 200) {
    fail(`PDF worker returned HTTP ${pdfWorkerResponse.status}`);
  }

  const serviceWorkerUrl = new URL(
    serviceWorkerMatch[1],
    new URL("/app.mjs", baseUrl),
  );
  if (serviceWorkerUrl.origin !== baseUrl.origin) fail("Service Worker is not same-origin");
  const serviceWorkerResponse = await fetch(serviceWorkerUrl);
  if (serviceWorkerResponse.status !== 200) {
    fail(`Service Worker returned HTTP ${serviceWorkerResponse.status}`);
  }

  console.log("STATIC_PREVIEW_RESULT=PASS");
  console.log(`FILE_COUNT=${files.length}`);
  console.log(`FILE_LIMIT=${CLOUDFLARE_FREE_FILE_LIMIT}`);
  console.log(`LARGEST_FILE=${largest.path}`);
  console.log(`LARGEST_FILE_BYTES=${largest.size}`);
  console.log(`ROUTES_200=${routeResults.join(",")}`);
  console.log(`UNKNOWN_ROUTE_STATUS=${missingResponse.status}`);
  console.log("UNKNOWN_ROUTE_DOCUMENT=404.html");
  console.log(`PDF_WORKER_URL=${pdfWorkerUrl.pathname}`);
  console.log("PDF_WORKER_SAME_ORIGIN=true");
  console.log(`SERVICE_WORKER_URL=${serviceWorkerUrl.pathname}`);
  console.log("SERVICE_WORKER_LOCALHOST_CONTRACT=PASS");
  console.log("BROKEN_LOCAL_REFERENCES=0");
  console.log("SENSITIVE_FILES=0");
} finally {
  await new Promise(resolveClose => server.close(resolveClose));
}

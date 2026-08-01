import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

export function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const requestedPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
      const filePath = resolve(root, relativePath);

      if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const info = await stat(filePath);
      const finalPath = info.isDirectory() ? resolve(filePath, "index.html") : filePath;
      const body = await readFile(finalPath);
      response.writeHead(200, {
        "Content-Type": contentTypes[extname(finalPath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const requestedPort = Number.parseInt(process.env.PORT || "4175", 10);
  const server = createStaticServer();
  server.listen(requestedPort, "127.0.0.1", () => {
    const address = server.address();
    console.log(`Warm Paper Academic Studio: http://127.0.0.1:${address.port}`);
  });
}

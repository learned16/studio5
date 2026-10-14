import http from "node:http"; import { readFileSync } from "node:fs";

const docf = () => { const page = readFileSync(process.argv[2], "utf8"); return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body><script>window.claude={use:async()=>null}</script>${page}</body></html>`; };
http.createServer((q, s) => { s.writeHead(200, { "content-type": "text/html; charset=utf-8" }); s.end(docf()); }).listen(+(process.argv[3] || 8765), () => console.log("up"));

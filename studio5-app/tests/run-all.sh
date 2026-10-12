#!/usr/bin/env bash
# Full Studio5 regression: claude.ai build, Cloudflare build (relay + companion in simulation), PDF, labs, Arabic.
# Needs: node 22, playwright (global), chromium, wrangler. Usage: bash tests/run-all.sh
set -e
cd "$(dirname "$0")/.."
export S="${S:-$(mktemp -d)}"; mkdir -p "$S/shots"
node build.mjs
python3 tests/mkpdf.py "$S/t.pdf"
node tests/serve.mjs dist/studio5.html & SERVE=$!
npx wrangler dev --port 8787 --ip 127.0.0.1 > "$S/wrangler.log" 2>&1 & WR=$!
trap 'kill $SERVE $WR 2>/dev/null' EXIT
sleep 12
OUT="$S/shots" PW="${PW:-playwright}" node tests/smoke.mjs
node tests/pdf.mjs
node tests/remote-e2e.mjs
node tests/link-e2e.mjs
if command -v Xvfb >/dev/null; then Xvfb :79 -screen 0 1920x1080x24 >/dev/null 2>&1 & XV=$!; sleep 1; DISPLAY=:79 node tests/rtc-e2e.mjs; kill $XV; fi
node tests/labs.mjs
node tests/selftest.mjs
node tests/ar.mjs
echo "Screenshots in $S/shots"

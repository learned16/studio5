/* Studio5 relay — runs on your own Cloudflare account.
   Serves the app (static assets) and relays end-to-end-encrypted messages between your phone and the
   Studio5 Companion on your laptop. The relay never sees command contents: they are AES-GCM encrypted
   with a key that only the paired phone and laptop derive (ECDH). It only routes, queues and reports presence. */

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const rand = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
const TUTOR_CAP = 300; // requests per day across your devices (~40 neurons each → well inside 10,000/day)
const okId = (s) => typeof s === "string" && /^[a-f0-9]{16,64}$/.test(s);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      if (url.pathname === "/api/health") return json({ ok: true, service: "studio5-relay", at: new Date().toISOString() });
      if (url.pathname.startsWith("/api/pair/")) {
        const stub = env.PAIRING.get(env.PAIRING.idFromName("pairing"));
        return stub.fetch(req);
      }
      if (url.pathname === "/api/tutor/addkey") return env.PAIRING.get(env.PAIRING.idFromName("pairing")).fetch(req);
      if (url.pathname.startsWith("/api/tutor/")) return tutor(req, env, url);
      if (url.pathname === "/api/ws") {
        const device = url.searchParams.get("device");
        if (!okId(device)) return json({ error: "bad device" }, 400);
        if (req.headers.get("upgrade") !== "websocket") return json({ error: "websocket required" }, 426);
        return env.ROOM.get(env.ROOM.idFromName(device)).fetch(req);
      }
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};

/* ---------- Tutor: Studio5's teacher, on YOUR Cloudflare account (Workers AI free daily allowance) ----------
   Only your devices can use it: the first device claims an owner key; more devices get it through a one-time
   link code, and phones paired with the laptop are accepted with their pairing token. A daily request cap
   protects the free allowance. The model sees only what the app sends (question + library excerpts). */
const TUTOR_MODEL = "@cf/google/gemma-4-26b-a4b-it";
async function tutor(req, env, url) {
  const pairing = env.PAIRING.get(env.PAIRING.idFromName("pairing"));
  if (url.pathname === "/api/tutor/claim" || url.pathname === "/api/tutor/status") return pairing.fetch(req);
  if (url.pathname === "/api/tutor/reset" && env.TUTOR_MOCK) return pairing.fetch(req); // tests only
  if (url.pathname !== "/api/tutor/chat" || req.method !== "POST") return json({ error: "not found" }, 404);
  const gate = await pairing.fetch(new Request("https://pairing/api/tutor/gate", { method: "POST", headers: { "x-s5-key": req.headers.get("x-s5-key") || "", "x-s5-device": req.headers.get("x-s5-device") || "", "x-s5-token": req.headers.get("x-s5-token") || "" } })).then((r) => r.json());
  if (!gate.ok) return json({ error: gate.error || "not allowed" }, gate.status || 403);
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.messages) || !body.messages.length) return json({ error: "bad request" }, 400);
  const messages = body.messages.slice(-24).map((m) => ({ role: ["system", "user", "assistant"].includes(m.role) ? m.role : "user", content: Array.isArray(m.content) ? m.content.slice(0, 6) : String(m.content || "").slice(0, 24000) }));
  const input = { messages, max_completion_tokens: Math.min(Math.max(body.max_tokens | 0 || 900, 64), 2500), temperature: typeof body.temperature === "number" ? body.temperature : 0.4, chat_template_kwargs: { enable_thinking: false } };
  if (body.json) input.response_format = { type: "json_object" };
  const stream = body.stream !== false && !body.json;
  if (env.TUTOR_MOCK) return mockTutor(messages, stream);
  if (!env.AI) return json({ error: "Workers AI is not connected to this Worker (add the AI binding and redeploy)" }, 503);
  try {
    if (!stream) { const r = await env.AI.run(TUTOR_MODEL, input); return json({ text: aiText(r), usage: r && r.usage }); }
    const up = await env.AI.run(TUTOR_MODEL, { ...input, stream: true });
    // normalise the model's event stream to {t:"text piece"} lines
    const enc = new TextEncoder(), dec = new TextDecoder(); let buf = "";
    const ts = new TransformStream({
      transform(chunk, ctl) { buf += dec.decode(chunk, { stream: true }); const lines = buf.split("\n"); buf = lines.pop(); for (const l of lines) { const d = l.trim(); if (!d.startsWith("data:")) continue; const v = d.slice(5).trim(); if (v === "[DONE]") continue; try { const o = JSON.parse(v); const t = (o.choices && o.choices[0] && (o.choices[0].delta && o.choices[0].delta.content || o.choices[0].text)) || o.response || ""; if (t) ctl.enqueue(enc.encode(`data: ${JSON.stringify({ t })}\n\n`)); if (o.usage) ctl.enqueue(enc.encode(`data: ${JSON.stringify({ usage: o.usage })}\n\n`)); } catch {} } },
      flush(ctl) { ctl.enqueue(enc.encode("data: [DONE]\n\n")); },
    });
    return new Response(up.pipeThrough(ts), { headers: { "content-type": "text/event-stream", "cache-control": "no-store" } });
  } catch (e) {
    const m = String(e && e.message || e); const quota = /quota|neuron|limit|4006|3036|429/i.test(m);
    return json({ error: quota ? "Today's free AI allowance is used up — it resets at 03:00 Baghdad time. The library and exercises still work." : "AI error: " + m }, quota ? 429 : 502);
  }
}
const aiText = (r) => (r && (r.response || (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content))) || "";
function mockTutor(messages, stream) { // for tests without a Cloudflare account
  const last = messages[messages.length - 1]; const q = typeof last.content === "string" ? last.content : JSON.stringify(last.content);
  const img = Array.isArray(last.content) && last.content.some((c) => c && c.type === "image_url" && /^data:image\//.test(c.image_url && c.image_url.url));
  const text = /JSON/.test(q) ? JSON.stringify({ ok: true, echo: q.slice(-40) }) : `شرح تجريبي${img ? " [صورة مستلمة]" : ""}: ${q.slice(-60)}\n[[laptop:open_app acad]]`;
  if (!stream) return json({ text });
  const enc = new TextEncoder(); const parts = text.match(/[\s\S]{1,12}/g);
  return new Response(new ReadableStream({ start(c) { for (const p of parts) c.enqueue(enc.encode(`data: ${JSON.stringify({ t: p })}\n\n`)); c.enqueue(enc.encode("data: [DONE]\n\n")); c.close(); } }), { headers: { "content-type": "text/event-stream" } });
}

/* Pairing: the laptop offers a short code; the phone claims it. Public keys are exchanged here,
   the shared secret is derived on the devices and never leaves them. */
export class Pairing {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(req) {
    const url = new URL(req.url); const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const now = Date.now(); const st = this.ctx.storage;
    if (url.pathname === "/api/pair/offer") {
      const { device, pub, name } = body;
      if (!okId(device) || typeof pub !== "string" || pub.length > 200) return json({ error: "bad offer" }, 400);
      let code; for (let i = 0; i < 20; i++) { code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)); if (!(await st.get("code:" + code))) break; }
      const token = rand(24);
      await st.put("code:" + code, { device, pub, name: String(name || "Laptop").slice(0, 60), exp: now + 10 * 60 * 1000 });
      await st.put("dev:" + device, { token, laptopPub: pub, phonePub: null, at: now });
      await this.env.ROOM.get(this.env.ROOM.idFromName(device)).fetch("https://room/init", { method: "POST", body: JSON.stringify({ token }) });
      return json({ code, token, expiresIn: 600 });
    }
    if (url.pathname === "/api/pair/claim") {
      const { code, pub } = body; const rec = await st.get("code:" + String(code || "").replace(/\D/g, ""));
      if (!rec || rec.exp < now) return json({ error: "Code not found or expired. Make a new one on the laptop." }, 404);
      if (typeof pub !== "string" || pub.length > 200) return json({ error: "bad key" }, 400);
      const dev = await st.get("dev:" + rec.device);
      await st.put("dev:" + rec.device, { ...dev, phonePub: pub, at: now });
      await st.delete("code:" + code);
      return json({ device: rec.device, laptopPub: rec.pub, name: rec.name, token: dev.token });
    }
    /* Linking another phone/iPad to an existing pairing: the paired phone leaves an encrypted blob under the
       hash of a one-time code; the new device takes it once. The relay never sees the code or the contents. */
    if (url.pathname === "/api/pair/link-put") {
      const { id, blob } = body;
      if (!/^[a-f0-9]{64}$/.test(id || "") || typeof blob !== "string" || blob.length > 8000) return json({ error: "bad link" }, 400);
      await st.put("link:" + id, { blob, exp: now + 10 * 60 * 1000 });
      return json({ ok: true, expiresIn: 600 });
    }
    if (url.pathname === "/api/pair/link-take") {
      const { id } = body; const rec = /^[a-f0-9]{64}$/.test(id || "") ? await st.get("link:" + id) : null;
      if (rec) await st.delete("link:" + id);
      if (!rec || rec.exp < now) return json({ error: "Link code not found or expired. Make a new one on your paired phone." }, 404);
      return json({ blob: rec.blob });
    }
    /* tutor access */
    if (url.pathname === "/api/tutor/claim") { // first device becomes the owner; later devices use a link code
      const keys = (await st.get("tutor:keys")) || [];
      if (keys.length) return json({ error: "The tutor already has an owner. Link this device from your other device (Laptop → System → Link another device)." }, 403);
      const key = rand(24); await st.put("tutor:keys", [key]); return json({ key });
    }
    if (url.pathname === "/api/tutor/reset" && this.env.TUTOR_MOCK) { await st.delete("tutor:keys"); await st.delete("tutor:use"); return json({ ok: true }); }
    if (url.pathname === "/api/tutor/status") { const keys = (await st.get("tutor:keys")) || []; const day = new Date().toISOString().slice(0, 10); const use = (await st.get("tutor:use")) || {}; return json({ claimed: keys.length > 0, today: use.day === day ? use.n : 0, cap: TUTOR_CAP }); }
    if (url.pathname === "/api/tutor/gate") {
      const key = req.headers.get("x-s5-key"), device = req.headers.get("x-s5-device"), token = req.headers.get("x-s5-token");
      const keys = (await st.get("tutor:keys")) || []; let ok = !!key && keys.includes(key);
      if (!ok && okId(device || "") && token) { const dev = await st.get("dev:" + device); ok = !!dev && dev.token === token; }
      if (!ok) return json({ ok: false, status: 403, error: "This device is not allowed to use the tutor yet." });
      const day = new Date().toISOString().slice(0, 10); const use = (await st.get("tutor:use")) || {}; const n = use.day === day ? use.n : 0;
      if (n >= TUTOR_CAP) return json({ ok: false, status: 429, error: `Daily tutor limit (${TUTOR_CAP}) reached — it resets tomorrow. The library still works.` });
      await st.put("tutor:use", { day, n: n + 1 }); return json({ ok: true, n: n + 1 });
    }
    if (url.pathname === "/api/tutor/addkey") { // an owner device adds a key to hand to a new device (inside a link code)
      const keys = (await st.get("tutor:keys")) || []; if (!keys.includes(body.key)) return json({ error: "not allowed" }, 403);
      const k = rand(24); keys.push(k); await st.put("tutor:keys", keys.slice(-20)); return json({ key: k });
    }
    if (url.pathname === "/api/pair/status") {
      const device = url.searchParams.get("device"); const token = url.searchParams.get("token");
      const dev = await st.get("dev:" + device);
      if (!dev || dev.token !== token) return json({ error: "unknown" }, 404);
      return json({ phonePub: dev.phonePub });
    }
    return json({ error: "not found" }, 404);
  }
}

/* Room: one per laptop. Holds the laptop and phone sockets (hibernation API), forwards opaque envelopes,
   queues messages for an offline laptop (24 h, max 50), and tells phones when the laptop is online. */
export class Room {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/init") { const { token } = await req.json(); await this.ctx.storage.put("token", token); return json({ ok: true }); }
    const token = await this.ctx.storage.get("token");
    const role = url.searchParams.get("role");
    if (!token || url.searchParams.get("token") !== token || !["laptop", "phone"].includes(role)) return json({ error: "unauthorised" }, 401);
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);
    if (role === "laptop") {
      const q = (await this.ctx.storage.get("queue")) || []; const fresh = q.filter((m) => m.at > Date.now() - 864e5);
      for (const m of fresh) server.send(m.data);
      await this.ctx.storage.put("queue", []);
      await this.ctx.storage.put("lastSeen", Date.now());
    }
    this.presence();
    return new Response(null, { status: 101, webSocket: client });
  }
  presence() {
    const laptop = this.ctx.getWebSockets("laptop").length > 0;
    const msg = JSON.stringify({ t: "presence", laptop, phones: this.ctx.getWebSockets("phone").length });
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch {} }
  }
  async webSocketMessage(ws, data) {
    const role = this.ctx.getTags(ws)[0]; if (typeof data !== "string" || data.length > 1_000_000) return;
    let env; try { env = JSON.parse(data); } catch { return; }
    if (env.t === "ping") { ws.send(JSON.stringify({ t: "pong", at: Date.now() })); return; }
    if (env.t !== "msg") return;
    const target = role === "laptop" ? "phone" : "laptop";
    const peers = this.ctx.getWebSockets(target);
    if (peers.length) { for (const p of peers) { try { p.send(data); } catch {} } }
    else if (role === "phone" && env.queue) {
      const q = (await this.ctx.storage.get("queue")) || []; q.push({ at: Date.now(), data }); while (q.length > 50) q.shift();
      await this.ctx.storage.put("queue", q); ws.send(JSON.stringify({ t: "queued", id: env.qid || null }));
    }
    if (role === "laptop") await this.ctx.storage.put("lastSeen", Date.now());
  }
  async webSocketClose(ws) { try { ws.close(); } catch {} this.presence(); }
  async webSocketError() { this.presence(); }
}

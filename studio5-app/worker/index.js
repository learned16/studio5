/* Studio5 relay — runs on your own Cloudflare account.
   Serves the app (static assets) and relays end-to-end-encrypted messages between your phone and the
   Studio5 Companion on your laptop. The relay never sees command contents: they are AES-GCM encrypted
   with a key that only the paired phone and laptop derive (ECDH). It only routes, queues and reports presence. */

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const rand = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
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

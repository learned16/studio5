/* Boot, event delegation, live re-rendering. */
// Standalone = served from its own site (Cloudflare), not inside a claude.ai artifact viewer.
S5.standalone = !(window.claude && typeof window.claude.use === "function");
if (S5.standalone && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("./sw.js").catch(() => {});
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); S5.installPrompt = e; S5.rerender && S5.rerender(); });
window.addEventListener("appinstalled", () => { S5.installPrompt = null; S5.ui.toast("Studio5 installed on this computer"); });
S5.act.install = async () => { const p = S5.installPrompt; if (!p) return; p.prompt(); try { await p.userChoice; } catch {} S5.installPrompt = null; S5.ui.render(); };
S5.LIVE = new Set(["notebook", "notebook-page", "drill", "file", "focus", "mock", "tool", "remote", "lab", "atelier"]);
S5.ui.isLive = () => { const r = S5.ui.route; return S5.LIVE.has(r.v) || (r.v === "lecture" && (r.tab || "capture") === "capture") || (r.v === "library" && r.tab === "council"); };
S5.act.go = (el) => S5.ui.go(el.dataset.v);
S5.LIVE.add("tests");
S5.act.back = () => S5.ui.back();
S5.act.open = (el) => {
  const d = el.dataset; const route = { v: d.v };
  if (d.id) route.id = d.id; if (d.tab) route.tab = d.tab; if (d.kind) route.kind = d.kind; if (d.calc) route.calc = d.calc;
  if (d.page !== undefined && d.page !== "") route.page = +d.page;
  const cur = S5.ui.route; const same = cur.v === route.v && cur.id === route.id;
  S5.ui.go(route, same && (route.tab !== undefined || route.page !== undefined));
};
S5.act.edit = (el) => { const r = S5.store.get(el.dataset.id); if (r) S5.ui.edit(el.dataset.type || r.type, r); };
S5.act.new = (el) => { let defaults = {}; try { defaults = el.dataset.defaults ? JSON.parse(el.dataset.defaults) : {}; } catch {} const r = S5.ui.route; if (!defaults.subjectId && r.v === "subject") defaults.subjectId = r.id; if (!defaults.projectId && r.v === "project" && S5.SCHEMA[el.dataset.type].fields.some((f) => f.k === "projectId")) defaults.projectId = r.id; S5.ui.edit(el.dataset.type, defaults); };
S5.act.capture = (el) => S5.openCapture({ subjectId: el.dataset.subject, projectId: el.dataset.project, kind: el.dataset.kind });
S5.act["dismiss-recovered"] = () => { S5.store.recovered = false; S5.ui.renderChrome(); };

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  if (el.tagName === "LABEL" || (el.tagName === "INPUT" && el.type === "checkbox")) return;
  if (e.target.closest("select,input,textarea") && e.target.closest("[data-act]") === el && el.classList.contains("item") && e.target !== el) return;
  const f = S5.act[el.dataset.act]; if (!f) return;
  e.preventDefault();
  try { const p = f(el, e); if (p && p.catch) p.catch((err) => { console.error(err); S5.ui.toast(err.message || "Something went wrong", true); }); } catch (err) { console.error(err); S5.ui.toast(err.message || "Something went wrong", true); }
});
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.dataset.actChange === "lec-pdf") { await S5.store.update(t.dataset.id, { fileId: t.value }); S5.ui.render(); }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
  if (document.querySelector(".scrim")) return;
  if (e.key === "c" && !e.ctrlKey && !e.metaKey && !S5.ui.isLive()) { e.preventDefault(); S5.openCapture(); }
  if (e.key === "/") { e.preventDefault(); document.getElementById("gsearch")?.focus(); }
});
/* thumbnails for images stored as blobs */
S5.fillThumbs = () => document.querySelectorAll("img[data-blob]:not([src])").forEach(async (img) => { const f = S5.store.get(img.dataset.blob); if (!f) return; const u = await S5.blobs.url(f.blobKey, f.assetId); if (u) img.src = u; });
const _render = S5.ui.render.bind(S5.ui);
S5.ui.render = function () { _render(); setTimeout(S5.fillThumbs, 0); };
/* re-render on data change, except views that hold live editors (they refresh themselves) */
S5.rerender = S5.debounce(() => { if (document.querySelector(".scrim")) { S5.pendingRender = true; return; } if (S5.ui.isLive()) S5.ui.renderChrome(); else { const y = window.scrollY; S5.ui.render(); window.scrollTo(0, y); } }, 120);
S5.bus.on("change", () => S5.rerender());
S5.bus.on("settings", () => { S5.applyTheme(); S5.i18n.setDir(); S5.rerender(); });
S5.bus.on("sync", () => { if (!document.querySelector(".scrim")) S5.ui.renderChrome(); });
S5.bus.on("ai", () => S5.rerender());
new MutationObserver(() => { if (S5.pendingRender && !document.querySelector(".scrim")) { S5.pendingRender = false; S5.rerender(); } }).observe(document.getElementById("modal-root"), { childList: true });

(async function boot() {
  try {
    await S5.store.init();
    S5.applyTheme();
    await S5.seedCurriculum();
    await S5.seedCivil();
    if (!S5.store.meta.demoSeeded && !S5.store.meta.demoCleared && !S5.store.list("slot").length) await S5.seedDemo();
    // daily automatic snapshot (device-local recovery point)
    const snaps = S5.store.meta.snapshots || [];
    if (!snaps.length || S5.daysBetween(snaps[0].at.slice(0, 10), S5.todayISO()) >= 1) S5.store.snapshot("Daily automatic snapshot");
    const h = (location.hash || "").replace("#", "");
    S5.ui.route = { v: S5.views[h] && ["today", "study", "projects", "practice", "library", "system", "remote"].includes(h) ? h : "today" };
    S5.ui.render();
    S5.i18n.start();
    S5.sync.init();
    if (S5.standalone && S5.store.meta.remote) S5.remote.connect();
    S5.ai.init();
    S5.health.refresh();
    window.addEventListener("hashchange", () => { const v = location.hash.replace("#", ""); if (v && v !== S5.ui.route.v && S5.views[v]) S5.ui.go(v, true); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") S5.rerender(); });
  } catch (e) {
    console.error(e);
    document.getElementById("view").innerHTML = `<div class="sheet alert"><h3>Studio5 could not start</h3><p class="small">${S5.esc(e.message)}</p><p class="small muted">Your data is not deleted. Reload the page; if this repeats, open it in a normal (not private) browser window.</p></div>`;
  }
})();

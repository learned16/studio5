/* Virtual Civil Lab — interactive experiments with real formulas. Learning only, never design approval.
   Every experiment can be saved as a lab report (inputs, results, your notes). */
S5.LAB = [
  ["truss", "Truss bridge under a moving truck", "جسر جملوني تحت شاحنة متحركة"],
  ["beam", "Beam lab — drag the loads", "مختبر العتبات — اسحب الأحمال"],
  ["concrete", "Concrete mix & cube crushing", "خلطة الخرسانة وكسر المكعبات"],
  ["steel", "Steel bar tension test", "فحص الشد لحديد التسليح"],
  ["soil", "Soil: sieve analysis & Proctor", "التربة: التحليل المنخلي وبروكتر"],
  ["channel", "Open channel flow (Manning)", "الجريان في القنوات المفتوحة (ماننك)"],
];
S5.views.lab = (r) => {
  const ex = r.id || "truss"; S5.labState = S5.labState || {};
  S5.ui.mount(() => S5.LAB_RUN[ex] && S5.LAB_RUN[ex](document.getElementById("lab-stage")));
  return `<div class="crumbs"><button data-act="open" data-v="practice" data-tab="lab">Practice</button></div>
  <div class="page-head"><div class="titles"><span class="eyebrow">Virtual civil lab · learning only</span><h1>Civil lab</h1></div><div class="row">${H.btn("Save lab report", "lab-save", { ex }, "primary")}</div></div>
  <div class="seg" style="margin-bottom:12px">${S5.LAB.map(([k, en]) => `<button data-act="open" data-v="lab" data-id="${k}" aria-pressed="${k === ex}">${S5.esc(en)}</button>`).join("")}</div>
  <div id="lab-stage"></div>
  ${H.section("Lab reports", (() => { const rs = S5.store.list("labReport").sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return rs.length ? `<div class="list">${rs.slice(0, 12).map((x) => H.item({ lead: "cobalt", t: S5.esc(x.title), s: `${S5.fmtDateTime(x.createdAt)} · ${S5.esc(x.summary || "")}`, act: "edit", data: { type: "labReport", id: x.id } })).join("")}</div>` : H.empty("No lab reports yet.", "Run an experiment, then “Save lab report”."); })())}`;
};
S5.act["lab-save"] = (el) => { const st = S5.labState[el.dataset.ex] || {}; const name = S5.LAB.find((x) => x[0] === el.dataset.ex)?.[1]; S5.ui.edit("labReport", { experiment: el.dataset.ex, title: `${name} — ${S5.fmtDate(S5.todayISO())}`, inputs: JSON.stringify(st.inputs || {}, null, 1), summary: st.summary || "", subjectId: "" }); };
/* helpers */
S5.labCanvas = (host, h = 360) => { const c = document.createElement("canvas"); c.style.width = "100%"; c.style.height = h + "px"; c.style.display = "block"; c.style.borderRadius = "8px"; c.style.background = "var(--paper)"; c.style.border = "1px solid var(--rule)"; host.appendChild(c); const fit = () => { const r = c.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); c.width = r.width * d; c.height = r.height * d; const x = c.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.direction = "ltr"; return { x, w: r.width, h: r.height }; }; return { c, fit }; };
S5.cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#333";
S5.labControls = (host, defs, onChange) => {
  const box = document.createElement("div"); box.className = "form-grid"; box.style.marginBottom = "10px"; box.dir = "ltr";
  box.innerHTML = defs.map(([k, label, min, max, step, val, opts]) => opts ? `<label class="field"><span>${label}</span><select data-lc="${k}">${opts.map(([v, n]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${n}</option>`).join("")}</select></label>` : `<label class="field"><span>${label} <b class="mono" data-lv="${k}">${val}</b></span><input type="range" data-lc="${k}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`).join("");
  host.appendChild(box);
  const read = () => Object.fromEntries([...box.querySelectorAll("[data-lc]")].map((e) => [e.dataset.lc, e.tagName === "SELECT" ? e.value : +e.value]));
  box.addEventListener("input", (e) => { const k = e.target.dataset.lc; const lv = box.querySelector(`[data-lv="${k}"]`); if (lv) lv.textContent = e.target.value; onChange(read()); });
  return read;
};
S5.labOut = (host) => { const d = document.createElement("div"); d.style.marginTop = "10px"; host.appendChild(d); return d; };
const kv = (rows) => `<div class="tbl-wrap"><table class="tbl"><tbody>${rows.map(([k, v, u = ""]) => `<tr><td>${k}</td><td class="num mono">${v}</td><td class="small muted">${u}</td></tr>`).join("")}</tbody></table></div>`;

S5.LAB_RUN = {
  /* ---------- 1. Truss bridge: 2D direct stiffness with a moving truck ---------- */
  truss(host) {
    const read = S5.labControls(host, [["type", "Truss type", 0, 0, 0, "pratt", [["pratt", "Pratt"], ["howe", "Howe"], ["warren", "Warren"]]], ["n", "Panels", 4, 12, 2, 8], ["span", "Span (m)", 12, 60, 1, 32], ["height", "Height (m)", 2, 10, 0.5, 5], ["truck", "Truck load (kN)", 50, 600, 10, 250], ["area", "Member area (cm²)", 10, 120, 5, 40], ["exag", "Deflection × ", 1, 300, 1, 80]], () => draw());
    const { c, fit } = S5.labCanvas(host, 380); const out = S5.labOut(host);
    let pos = 0, playing = true, raf;
    const ctr = document.createElement("div"); ctr.className = "row"; ctr.style.marginTop = "8px"; ctr.innerHTML = `<button class="btn sm" data-x="play">⏸ Pause</button><label class="small row" style="gap:6px">Truck position <input type="range" min="0" max="1" step="0.005" value="0" data-x="pos" style="width:200px"></label>`; host.insertBefore(ctr, out);
    ctr.addEventListener("input", (e) => { if (e.target.dataset.x === "pos") { pos = +e.target.value; playing = false; ctr.querySelector('[data-x="play"]').textContent = "▶ Play"; draw(); } });
    ctr.addEventListener("click", (e) => { if (e.target.dataset.x === "play") { playing = !playing; e.target.textContent = playing ? "⏸ Pause" : "▶ Play"; if (playing) loop(); } });
    const build = (p) => {
      const n = p.n, L = p.span, H = p.height, dx = L / n; const nodes = []; const bars = [];
      for (let i = 0; i <= n; i++) nodes.push([i * dx, 0]);
      if (p.type === "warren") { for (let i = 0; i < n; i++) nodes.push([(i + 0.5) * dx, H]); for (let i = 0; i < n; i++) bars.push([i, i + 1]); for (let i = 0; i < n - 1; i++) bars.push([n + 1 + i, n + 2 + i]); for (let i = 0; i < n; i++) { bars.push([i, n + 1 + i]); bars.push([n + 1 + i, i + 1]); } }
      else { for (let i = 1; i < n; i++) nodes.push([i * dx, H]); const top = (i) => n + i; for (let i = 0; i < n; i++) bars.push([i, i + 1]); bars.push([0, top(1)]); bars.push([n, top(n - 1)]); for (let i = 1; i < n - 1; i++) bars.push([top(i), top(i + 1)]); for (let i = 1; i < n; i++) bars.push([i, top(i)]); for (let i = 1; i < n - 1; i++) { const left = i < n / 2; if ((p.type === "pratt") === left) bars.push([top(i), i + 1]); else bars.push([i, top(i + 1)]); } }
      return { nodes, bars };
    };
    const solve = (p, loads) => {
      const { nodes, bars } = build(p); const N = nodes.length, dof = 2 * N; const E = 200e6, A = p.area * 1e-4; // kN/m², m²
      const K = Array.from({ length: dof }, () => new Float64Array(dof)); const F = new Float64Array(dof);
      const geo = bars.map(([a, b]) => { const [x1, y1] = nodes[a], [x2, y2] = nodes[b]; const l = Math.hypot(x2 - x1, y2 - y1); return { a, b, l, c: (x2 - x1) / l, s: (y2 - y1) / l }; });
      for (const g of geo) { const k = (E * A) / g.l, cc = g.c * g.c, ss = g.s * g.s, cs = g.c * g.s; const m = [[cc, cs, -cc, -cs], [cs, ss, -cs, -ss], [-cc, -cs, cc, cs], [-cs, -ss, cs, ss]]; const id = [2 * g.a, 2 * g.a + 1, 2 * g.b, 2 * g.b + 1]; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[id[i]][id[j]] += k * m[i][j]; }
      for (const [node, fy] of loads) F[2 * node + 1] -= fy;
      const fixed = new Set([0, 1, 2 * p.n + 1]); // pin at left, roller at right
      const free = [...Array(dof).keys()].filter((i) => !fixed.has(i)); const m = free.length;
      const Ab = free.map((i) => free.map((j) => K[i][j])); const bb = free.map((i) => F[i]);
      for (let i = 0; i < m; i++) { let piv = i; for (let r = i + 1; r < m; r++) if (Math.abs(Ab[r][i]) > Math.abs(Ab[piv][i])) piv = r; [Ab[i], Ab[piv]] = [Ab[piv], Ab[i]]; [bb[i], bb[piv]] = [bb[piv], bb[i]]; const d = Ab[i][i] || 1e-12; for (let r = i + 1; r < m; r++) { const f = Ab[r][i] / d; if (!f) continue; for (let cI = i; cI < m; cI++) Ab[r][cI] -= f * Ab[i][cI]; bb[r] -= f * bb[i]; } }
      const xs = new Float64Array(m); for (let i = m - 1; i >= 0; i--) { let s = bb[i]; for (let cI = i + 1; cI < m; cI++) s -= Ab[i][cI] * xs[cI]; xs[i] = s / (Ab[i][i] || 1e-12); }
      const U = new Float64Array(dof); free.forEach((d, i) => (U[d] = xs[i]));
      const forces = geo.map((g) => ((E * A) / g.l) * ((U[2 * g.b] - U[2 * g.a]) * g.c + (U[2 * g.b + 1] - U[2 * g.a + 1]) * g.s));
      return { nodes, bars, U, forces };
    };
    const draw = () => {
      const p = read(); const { x, w, h } = fit(); const ink = S5.cssVar("--ink"), red = S5.cssVar("--redline"), blue = S5.cssVar("--cobalt");
      // truck = two axles 4 m apart, load split 1/3 front, 2/3 rear, distributed to bottom chord nodes linearly
      const L = p.span, dx = L / p.n, loads = []; const axles = [[pos * (L + 4) - 4, p.truck / 3], [pos * (L + 4), (p.truck * 2) / 3]];
      for (const [ax, P] of axles) { if (ax < 0 || ax > L) continue; const i = Math.min(p.n - 1, Math.floor(ax / dx)); const t = (ax - i * dx) / dx; loads.push([i, P * (1 - t)], [i + 1, P * t]); }
      const sol = solve(p, loads); const sc = Math.min((w - 60) / L, (h - 130) / p.height); const ox = 30, oy = h - 70;
      const X = (nx) => ox + nx * sc, Y = (ny) => oy - ny * sc; const ex = p.exag;
      x.clearRect(0, 0, w, h);
      x.fillStyle = S5.cssVar("--paper-2"); x.fillRect(0, oy + 8, w, h - oy - 8); // river bank
      x.fillStyle = blue + "22"; x.fillRect(X(0) + 10, oy + 25, X(L) - X(0) - 20, h - oy - 25);
      const fy = p.area * 1e-4 * 250e3; // kN capacity at fy = 250 MPa
      const maxF = Math.max(1, ...sol.forces.map(Math.abs));
      sol.bars.forEach(([a, b], i) => { const f = sol.forces[i]; const ua = [sol.U[2 * a] * ex, sol.U[2 * a + 1] * ex], ub = [sol.U[2 * b] * ex, sol.U[2 * b + 1] * ex]; const util = Math.abs(f) / fy; x.strokeStyle = util > 1 ? (Date.now() % 600 < 300 ? red : ink) : f >= 0 ? blue : red; x.globalAlpha = 0.35 + 0.65 * Math.min(1, Math.abs(f) / maxF); x.lineWidth = 1.5 + 6 * Math.abs(f) / maxF; x.beginPath(); x.moveTo(X(sol.nodes[a][0] + ua[0]), Y(sol.nodes[a][1] + ua[1])); x.lineTo(X(sol.nodes[b][0] + ub[0]), Y(sol.nodes[b][1] + ub[1])); x.stroke(); });
      x.globalAlpha = 1; x.fillStyle = ink; sol.nodes.forEach(([nx, ny], i) => { x.beginPath(); x.arc(X(nx + sol.U[2 * i] * ex), Y(ny + sol.U[2 * i + 1] * ex), 3, 0, 7); x.fill(); });
      // supports
      x.fillStyle = S5.cssVar("--graphite"); [[0, "pin"], [L, "roller"]].forEach(([sx, k]) => { x.beginPath(); x.moveTo(X(sx), oy + 2); x.lineTo(X(sx) - 10, oy + 18); x.lineTo(X(sx) + 10, oy + 18); x.closePath(); x.fill(); if (k === "roller") { x.beginPath(); x.arc(X(sx) - 5, oy + 22, 3, 0, 7); x.arc(X(sx) + 5, oy + 22, 3, 0, 7); x.fill(); } });
      // truck
      const tx = X(pos * (L + 4) - 2); x.fillStyle = S5.cssVar("--amber"); x.fillRect(tx - 4 * sc / 2 - 6, oy - 30, 4 * sc + 12, 22); x.fillStyle = ink; x.fillRect(tx + 4 * sc / 2 - 2, oy - 40, 14, 32); [[-2], [2]].forEach(([o]) => { x.beginPath(); x.arc(tx + o * sc, oy - 6, 6, 0, 7); x.fill(); });
      x.font = "12px IBM Plex Mono"; x.fillStyle = ink; x.fillText(`${p.truck} kN`, tx - 20, oy - 46);
      const iMax = sol.forces.reduce((m, f, i) => (Math.abs(f) > Math.abs(sol.forces[m]) ? i : m), 0); const midDef = Math.min(...sol.U.filter((_, i) => i % 2)) * 1000;
      x.fillStyle = blue; x.fillText("tension", 12, 18); x.fillStyle = red; x.fillText("compression", 80, 18); x.fillStyle = ink; x.fillText(`max deflection ${S5.round(-midDef, 1)} mm (×${ex})`, 190, 18);
      const util = Math.abs(sol.forces[iMax]) / fy;
      out.innerHTML = kv([["Max member force", S5.round(sol.forces[iMax], 1), sol.forces[iMax] >= 0 ? "kN tension" : "kN compression"], ["Member capacity (fy 250 MPa)", S5.round(fy, 0), "kN"], ["Utilisation", Math.round(util * 100) + "%", util > 1 ? "⚠ overstressed — increase area or depth" : "ok"], ["Max deflection", S5.round(-midDef, 2), `mm (limit L/400 = ${S5.round((L * 1000) / 400, 0)} mm)`]]) + `<p class="tiny muted">Direct stiffness method, pin + roller supports, steel E = 200 GPa. Compression members are not checked for buckling here — real design must.</p>`;
      S5.labState.truss = { inputs: { ...p, truckPosition: S5.round(pos, 2) }, summary: `${p.type} ${p.n} panels, span ${L} m: max ${S5.round(sol.forces[iMax], 0)} kN, utilisation ${Math.round(util * 100)}%` };
    };
    const loop = () => { if (!playing || !c.isConnected) return; pos = (pos + 0.003) % 1; const s = ctr.querySelector('[data-x="pos"]'); if (s) s.value = pos; draw(); raf = requestAnimationFrame(loop); };
    draw(); loop(); return () => cancelAnimationFrame(raf);
  },
  /* ---------- 2. Beam lab with draggable loads and numeric deflection ---------- */
  beam(host) {
    const read = S5.labControls(host, [["sup", "Supports", 0, 0, 0, "ss", [["ss", "Simply supported"], ["cant", "Cantilever (fixed at left)"]]], ["L", "Span (m)", 2, 12, 0.5, 6], ["w", "Uniform load (kN/m)", 0, 40, 1, 10], ["E", "E (GPa)", 10, 210, 5, 25], ["I", "I (×10⁶ mm⁴)", 50, 3000, 50, 900]], () => draw());
    const { c, fit } = S5.labCanvas(host, 420); const out = S5.labOut(host);
    const st = S5.labState.beam?.loads ? S5.labState.beam : { loads: [{ x: 0.35, P: 40 }, { x: 0.7, P: 25 }] };
    const add = document.createElement("div"); add.className = "row"; add.style.marginTop = "8px"; add.innerHTML = `<button class="btn sm" data-b="add">+ Point load</button><button class="btn sm" data-b="del">− Remove last</button><span class="tiny muted">Drag the red arrows along the beam. Double-click an arrow to change its value.</span>`; host.insertBefore(add, out);
    add.onclick = (e) => { if (e.target.dataset.b === "add") st.loads.push({ x: 0.5, P: 20 }); if (e.target.dataset.b === "del") st.loads.pop(); draw(); };
    let drag = null, geom = null;
    c.addEventListener("pointerdown", (e) => { const r = c.getBoundingClientRect(); const mx = e.clientX - r.left; const i = st.loads.findIndex((l) => Math.abs(geom.X(l.x * geom.L) - mx) < 14); if (i >= 0) { drag = i; c.setPointerCapture(e.pointerId); } });
    c.addEventListener("pointermove", (e) => { if (drag == null) return; const r = c.getBoundingClientRect(); st.loads[drag].x = S5.clamp((e.clientX - r.left - geom.ox) / (geom.sc * geom.L), 0, 1); draw(); });
    c.addEventListener("pointerup", () => (drag = null));
    c.addEventListener("dblclick", (e) => { const r = c.getBoundingClientRect(); const i = st.loads.findIndex((l) => Math.abs(geom.X(l.x * geom.L) - (e.clientX - r.left)) < 14); if (i < 0) return; const m = S5.ui.modal("Point load", `<label class="field"><span>P (kN)</span><input id="pl-v" type="number" value="${st.loads[i].P}"></label>`, { footer: `<button class="btn primary" id="pl-ok">OK</button>` }); m.el.querySelector("#pl-ok").onclick = () => { st.loads[i].P = +m.el.querySelector("#pl-v").value || 0; m.close(); draw(); }; });
    const draw = () => {
      const p = read(); const { x, w, h } = fit(); const L = p.L, N = 240, EI = p.E * 1e6 * p.I * 1e-6; // kN·m²
      const xs = Array.from({ length: N + 1 }, (_, i) => (L * i) / N); const loads = st.loads.map((l) => ({ a: l.x * L, P: l.P }));
      let RA, MA = 0; const tot = p.w * L + loads.reduce((s, l) => s + l.P, 0);
      if (p.sup === "ss") { const mom = (p.w * L * L) / 2 + loads.reduce((s, l) => s + l.P * l.a, 0); const RB = mom / L; RA = tot - RB; } else { RA = tot; MA = -((p.w * L * L) / 2 + loads.reduce((s, l) => s + l.P * l.a, 0)); }
      const V = xs.map((xx) => RA - p.w * xx - loads.filter((l) => l.a < xx).reduce((s, l) => s + l.P, 0));
      const M = xs.map((xx) => MA + RA * xx - (p.w * xx * xx) / 2 - loads.filter((l) => l.a < xx).reduce((s, l) => s + l.P * (xx - l.a), 0));
      // integrate curvature twice (trapezoid), then apply boundary conditions
      const dxs = L / N; const th = [0], y = [0]; for (let i = 1; i <= N; i++) th.push(th[i - 1] + ((M[i - 1] + M[i]) / 2 / EI) * dxs); for (let i = 1; i <= N; i++) y.push(y[i - 1] + ((th[i - 1] + th[i]) / 2) * dxs);
      if (p.sup === "ss") { const c1 = -y[N] / L; for (let i = 0; i <= N; i++) y[i] += c1 * xs[i]; }
      const ymax = y.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0); const Mmax = M.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0); const Vmax = V.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0);
      const ox = 40, sc = (w - 80) / L; geom = { ox, sc, L, X: (xx) => ox + xx * sc };
      x.clearRect(0, 0, w, h); const ink = S5.cssVar("--ink"), red = S5.cssVar("--redline"), blue = S5.cssVar("--cobalt"), gr = S5.cssVar("--graphite");
      const by = 80; const defScale = Math.abs(ymax) > 1e-9 ? 40 / Math.abs(ymax) : 0;
      // deflected shape (exaggerated) + beam
      x.strokeStyle = blue + "88"; x.setLineDash([5, 4]); x.lineWidth = 2; x.beginPath(); xs.forEach((xx, i) => { const yy = by + y[i] * defScale * -1 * -1; i ? x.lineTo(geom.X(xx), by - y[i] * defScale) : x.moveTo(geom.X(xx), by - y[i] * defScale); }); x.stroke(); x.setLineDash([]);
      x.fillStyle = gr; x.fillRect(geom.X(0), by - 5, L * sc, 10);
      if (p.sup === "ss") { [0, L].forEach((sx, k) => { x.beginPath(); x.moveTo(geom.X(sx), by + 5); x.lineTo(geom.X(sx) - 9, by + 20); x.lineTo(geom.X(sx) + 9, by + 20); x.closePath(); x.fill(); }); } else { x.fillRect(geom.X(0) - 12, by - 30, 12, 60); for (let k = -30; k < 30; k += 8) { x.beginPath(); x.moveTo(geom.X(0) - 12, by + k); x.lineTo(geom.X(0) - 20, by + k + 8); x.strokeStyle = gr; x.stroke(); } }
      if (p.w) { x.strokeStyle = blue; x.lineWidth = 1; for (let xx = 0; xx <= L + 1e-6; xx += L / 20) { x.beginPath(); x.moveTo(geom.X(xx), by - 28); x.lineTo(geom.X(xx), by - 7); x.stroke(); } x.font = "11px IBM Plex Mono"; x.fillStyle = blue; x.fillText(`w = ${p.w} kN/m`, geom.X(L) - 90, by - 32); }
      st.loads.forEach((l) => { const X0 = geom.X(l.x * L); x.strokeStyle = red; x.fillStyle = red; x.lineWidth = 3; x.beginPath(); x.moveTo(X0, by - 60); x.lineTo(X0, by - 10); x.stroke(); x.beginPath(); x.moveTo(X0, by - 6); x.lineTo(X0 - 7, by - 18); x.lineTo(X0 + 7, by - 18); x.fill(); x.font = "12px IBM Plex Mono"; x.fillText(`${l.P} kN`, X0 + 6, by - 52); });
      // SFD and BMD
      const plot = (arr, top, hh, color, label) => { const mx = Math.max(1e-9, ...arr.map(Math.abs)); const Y = (v) => top + hh / 2 - (v / mx) * (hh / 2 - 6); x.strokeStyle = gr; x.lineWidth = 1; x.beginPath(); x.moveTo(geom.X(0), Y(0)); x.lineTo(geom.X(L), Y(0)); x.stroke(); x.fillStyle = color + "33"; x.strokeStyle = color; x.lineWidth = 2; x.beginPath(); x.moveTo(geom.X(0), Y(0)); xs.forEach((xx, i) => x.lineTo(geom.X(xx), Y(arr[i]))); x.lineTo(geom.X(L), Y(0)); x.closePath(); x.fill(); x.beginPath(); xs.forEach((xx, i) => (i ? x.lineTo(geom.X(xx), Y(arr[i])) : x.moveTo(geom.X(xx), Y(arr[i])))); x.stroke(); x.fillStyle = ink; x.font = "11px IBM Plex Mono"; x.fillText(label, 6, top + 12); };
      plot(V, 140, 120, blue, "V (kN)"); plot(M.map((v) => -v), 280, 130, red, "M (kN·m)");
      const lim = ((p.sup === "ss" ? 250 : 180) && (L * 1000) / (p.sup === "ss" ? 250 : 180));
      out.innerHTML = kv([["Reaction at A", S5.round(RA, 2), "kN"], p.sup === "cant" ? ["Fixed-end moment", S5.round(MA, 2), "kN·m"] : ["Reaction at B", S5.round(tot - RA, 2), "kN"], ["Max shear", S5.round(Vmax, 2), "kN"], ["Max moment", S5.round(Mmax, 2), "kN·m"], ["Max deflection", S5.round(Math.abs(ymax) * 1000, 2), `mm (limit ${S5.round(lim, 1)} mm)`]]) + (Math.abs(ymax) * 1000 > lim ? `<p class="small" style="color:var(--redline)">⚠ Deflection over the limit — increase I or shorten the span.</p>` : "");
      S5.labState.beam = { loads: st.loads, inputs: { ...p, loads: st.loads.map((l) => ({ at: S5.round(l.x * L, 2), P: l.P })) }, summary: `${p.sup === "ss" ? "Simply supported" : "Cantilever"} L=${L} m: Mmax ${S5.round(Mmax, 1)} kN·m, δmax ${S5.round(Math.abs(ymax) * 1000, 1)} mm` };
    };
    draw();
  },
  /* ---------- 3. Concrete mix & cube crushing ---------- */
  concrete(host) {
    const read = S5.labControls(host, [["wc", "Water / cement ratio", 0.3, 0.8, 0.01, 0.5], ["cement", "Cement (kg/m³)", 250, 550, 10, 350], ["age", "Age at test (days)", 3, 90, 1, 28], ["cure", "Curing", 0, 0, 0, "moist", [["moist", "Moist cured"], ["air", "Air dried (poor)"]]], ["target", "Target f'c (MPa)", 15, 50, 1, 25]], () => update());
    const { c, fit } = S5.labCanvas(host, 340); const out = S5.labOut(host);
    const btn = document.createElement("div"); btn.className = "row"; btn.style.marginTop = "8px"; btn.innerHTML = `<button class="btn primary sm" data-c="crush">Crush 3 cubes (150 mm)</button><span class="tiny muted">Each cube varies a little, like real tests.</span>`; host.insertBefore(btn, out);
    let anim = null, results = [];
    const model = (p) => { const f28 = 96.5 / Math.pow(7, p.wc) * (p.cure === "air" ? 0.78 : 1); const ft = f28 * (p.age / (4 + 0.85 * p.age)); const water = p.cement * p.wc; const slump = S5.clamp((water - 140) * 2.2, 0, 220); return { f28, ft, water, slump }; };
    const update = () => { results = []; drawCurve(null); summary(); };
    const drawCurve = (prog) => {
      const p = read(); const m = model(p); const { x, w, h } = fit(); const ink = S5.cssVar("--ink"), red = S5.cssVar("--redline"), blue = S5.cssVar("--cobalt");
      x.clearRect(0, 0, w, h);
      // stress-strain (Hognestad) up to failure
      const e0 = 0.002, eu = 0.0035; const gx = 60, gy = h - 40, gw = w * 0.55, gh = h - 80; const fmax = Math.max(m.ft, 1) * 1.15;
      x.strokeStyle = S5.cssVar("--rule-strong"); x.beginPath(); x.moveTo(gx, gy - gh); x.lineTo(gx, gy); x.lineTo(gx + gw, gy); x.stroke(); x.fillStyle = ink; x.font = "11px IBM Plex Mono"; x.fillText("stress (MPa)", gx - 50, gy - gh - 8); x.fillText("strain", gx + gw - 40, gy + 26);
      const curve = (fc, upto) => { x.beginPath(); for (let e = 0; e <= upto; e += eu / 120) { const s = e <= e0 ? fc * (2 * e / e0 - (e / e0) ** 2) : fc * (1 - 0.15 * (e - e0) / (eu - e0)); const X = gx + (e / eu) * gw, Y = gy - (s / fmax) * gh; e ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); };
      results.forEach((r) => { x.strokeStyle = blue + "66"; x.lineWidth = 1.5; curve(r, eu); });
      if (prog) { x.strokeStyle = red; x.lineWidth = 2.5; curve(prog.fc, prog.e); }
      x.strokeStyle = S5.cssVar("--green"); x.setLineDash([4, 4]); const ty = gy - (p.target / fmax) * gh; x.beginPath(); x.moveTo(gx, ty); x.lineTo(gx + gw, ty); x.stroke(); x.setLineDash([]); x.fillStyle = S5.cssVar("--green"); x.fillText(`target ${p.target} MPa`, gx + 6, ty - 4);
      // the cube in the press
      const cx = gx + gw + 40, cw = Math.min(140, w - cx - 30), cy = 70; const squeeze = prog ? (prog.e / eu) * 8 : 0;
      x.fillStyle = S5.cssVar("--graphite"); x.fillRect(cx - 20, cy - 30 + squeeze, cw + 40, 20); x.fillRect(cx - 20, cy + cw + 10, cw + 40, 20);
      x.fillStyle = "#b9b6ad"; x.fillRect(cx, cy - 10 + squeeze, cw, cw + 20 - squeeze);
      if (prog && prog.e > e0) { x.strokeStyle = "#3a3a3a"; x.lineWidth = 1.5; const k = (prog.e - e0) / (eu - e0); for (let i = 0; i < 6; i++) { const sx = cx + cw * (0.15 + 0.14 * i); x.beginPath(); x.moveTo(sx, cy + squeeze); x.lineTo(sx + (i % 2 ? 14 : -14) * k, cy + cw * 0.5); x.lineTo(sx, cy + cw * k + 10); x.stroke(); } }
      x.fillStyle = ink; x.font = "12px IBM Plex Mono"; if (prog) x.fillText(`load ${Math.round(prog.s * 22.5)} kN`, cx, cy + cw + 50);
    };
    const summary = () => {
      const p = read(); const m = model(p); const mean = results.length ? results.reduce((a, b) => a + b, 0) / results.length : null;
      out.innerHTML = kv([["Predicted 28-day strength", S5.round(m.f28, 1), "MPa (Abrams-type law)"], [`Predicted at ${p.age} days`, S5.round(m.ft, 1), "MPa (ACI time curve)"], ["Water content", Math.round(m.water), "kg/m³"], ["Estimated slump", Math.round(m.slump), "mm"], ...(results.length ? [["Cube results", results.map((r) => S5.round(r, 1)).join(" · "), "MPa"], ["Mean of cubes", S5.round(mean, 1), mean >= p.target ? "✓ meets target" : "✗ below target"]] : [])]) + `<p class="tiny muted">Model: f₂₈ = 96.5 / 7^(w/c); f(t) = f₂₈ · t / (4 + 0.85t). Real mixes need trial batches and the Iraqi specification.</p>`;
      S5.labState.concrete = { inputs: p, summary: `w/c ${p.wc}, ${p.cement} kg cement, ${p.age} d: predicted ${S5.round(m.ft, 1)} MPa${mean ? `, cubes mean ${S5.round(mean, 1)} MPa` : ""}` };
    };
    btn.onclick = (e) => { if (e.target.dataset.c !== "crush") return; const p = read(); const m = model(p); results = []; let k = 0; const one = () => { const fc = m.ft * (1 + (Math.random() - 0.5) * 0.12); let e = 0; const step = () => { e += 0.0035 / 70; const s = e <= 0.002 ? fc * (2 * e / 0.002 - (e / 0.002) ** 2) : fc * (1 - 0.15 * (e - 0.002) / 0.0015); drawCurve({ fc, e, s }); if (e < 0.0035 && c.isConnected) anim = requestAnimationFrame(step); else { results.push(fc); summary(); if (++k < 3) setTimeout(one, 300); } }; step(); }; one(); };
    update(); return () => cancelAnimationFrame(anim);
  },
  /* ---------- 4. Steel tension test ---------- */
  steel(host) {
    const read = S5.labControls(host, [["d", "Bar diameter (mm)", 8, 32, 2, 16], ["grade", "Grade", 0, 0, 0, "420", [["280", "Grade 40 (fy 280)"], ["420", "Grade 60 (fy 420)"], ["520", "Grade 75 (fy 520)"]]], ["L0", "Gauge length (mm)", 100, 400, 10, 200]], () => run(true));
    const { c, fit } = S5.labCanvas(host, 340); const out = S5.labOut(host);
    const btn = document.createElement("div"); btn.className = "row"; btn.style.marginTop = "8px"; btn.innerHTML = `<button class="btn primary sm">▶ Pull the bar</button>`; host.insertBefore(btn, out);
    let raf;
    const law = (fy, e) => { const E = 200000, ey = fy / E, esh = 0.012, eu = 0.12, ef = 0.16, fu = fy * 1.35; if (e <= ey) return E * e; if (e <= esh) return fy; if (e <= eu) return fy + (fu - fy) * (1 - ((eu - e) / (eu - esh)) ** 2); return fu - (fu * 0.25) * ((e - eu) / (ef - eu)); };
    const run = (still) => {
      cancelAnimationFrame(raf); const p = read(); const fy = +p.grade; const A = Math.PI * p.d * p.d / 4; let e = still ? 0.16 : 0;
      const frame = () => {
        const { x, w, h } = fit(); x.clearRect(0, 0, w, h); const ink = S5.cssVar("--ink"), red = S5.cssVar("--redline"), blue = S5.cssVar("--cobalt");
        const gx = 60, gy = h - 40, gw = w * 0.58, gh = h - 80, fmax = fy * 1.45;
        x.strokeStyle = S5.cssVar("--rule-strong"); x.beginPath(); x.moveTo(gx, gy - gh); x.lineTo(gx, gy); x.lineTo(gx + gw, gy); x.stroke(); x.fillStyle = ink; x.font = "11px IBM Plex Mono"; x.fillText("stress (MPa)", gx - 50, gy - gh - 8); x.fillText("strain", gx + gw - 40, gy + 26);
        x.strokeStyle = red; x.lineWidth = 2.5; x.beginPath(); for (let s = 0; s <= e; s += 0.0004) { const X = gx + (s / 0.16) * gw, Y = gy - (law(fy, s) / fmax) * gh; s ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
        [["fy", fy], ["fu", fy * 1.35]].forEach(([n, v]) => { const Y = gy - (v / fmax) * gh; x.setLineDash([3, 4]); x.strokeStyle = blue; x.lineWidth = 1; x.beginPath(); x.moveTo(gx, Y); x.lineTo(gx + gw, Y); x.stroke(); x.setLineDash([]); x.fillStyle = blue; x.fillText(`${n} ${Math.round(v)}`, gx + gw - 70, Y - 4); });
        // the specimen
        const sx = gx + gw + 60, top = 40, len = (h - 120) * (1 + Math.min(e, 0.16) * 1.2); const neck = e > 0.12 ? (e - 0.12) / 0.04 : 0; const bw = 18;
        x.fillStyle = S5.cssVar("--graphite"); x.fillRect(sx - 22, top - 20, 44 + bw, 26); x.fillRect(sx - 22, top + len - 6, 44 + bw, 26);
        x.fillStyle = "#8d949f"; if (e >= 0.16) { x.fillRect(sx, top, bw, len / 2 - 6); x.fillRect(sx, top + len / 2 + 6, bw, len / 2 - 6); x.fillStyle = red; x.fillText("fracture", sx + bw + 8, top + len / 2 + 4); } else { x.beginPath(); x.moveTo(sx, top); x.lineTo(sx, top + len / 2 - 20); x.lineTo(sx + bw * neck * 0.35, top + len / 2); x.lineTo(sx, top + len / 2 + 20); x.lineTo(sx, top + len); x.lineTo(sx + bw, top + len); x.lineTo(sx + bw, top + len / 2 + 20); x.lineTo(sx + bw - bw * neck * 0.35, top + len / 2); x.lineTo(sx + bw, top + len / 2 - 20); x.lineTo(sx + bw, top); x.closePath(); x.fill(); }
        x.fillStyle = ink; x.fillText(`F = ${Math.round(law(fy, e) * A / 1000)} kN`, sx - 20, top + len + 40);
        if (e < 0.16) { e = Math.min(0.16, e + (e < 0.012 ? 0.00015 : 0.0012)); raf = requestAnimationFrame(frame); }
      };
      frame();
      out.innerHTML = kv([["Area", S5.round(A, 1), "mm²"], ["Yield force", S5.round(fy * A / 1000, 1), "kN"], ["Ultimate force", S5.round(fy * 1.35 * A / 1000, 1), "kN"], ["fu / fy", "1.35", "ductility indicator (≥ 1.25 required by most codes)"], ["Elongation at fracture", "16%", `on ${p.L0} mm → ${S5.round(p.L0 * 1.16, 0)} mm`]]);
      S5.labState.steel = { inputs: p, summary: `Ø${p.d} mm, fy ${fy} MPa: yield ${S5.round(fy * A / 1000, 1)} kN, ultimate ${S5.round(fy * 1.35 * A / 1000, 1)} kN` };
    };
    btn.onclick = () => run(false); run(true); return () => cancelAnimationFrame(raf);
  },
  /* ---------- 5. Soil: sieve analysis + Proctor compaction ---------- */
  soil(host) {
    const sieves = [[4.75, "#4"], [2.36, "#8"], [1.18, "#16"], [0.6, "#30"], [0.3, "#50"], [0.15, "#100"], [0.075, "#200"], [0, "Pan"]];
    const st = S5.labState.soil?.data || { ret: [12, 48, 85, 120, 96, 62, 41, 36], proctor: [[8, 1.92], [10, 2.02], [12, 2.08], [14, 2.05], [16, 1.96]] };
    host.insertAdjacentHTML("beforeend", `<div class="grid cols-2"><section class="sheet flat"><h4>Sieve analysis — mass retained (g)</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Sieve</th><th>mm</th><th>Retained g</th></tr></thead><tbody>${sieves.map(([mm, n], i) => `<tr><td>${n}</td><td class="mono">${mm || "—"}</td><td><input type="number" data-ret="${i}" value="${st.ret[i]}"></td></tr>`).join("")}</tbody></table></div></section>
      <section class="sheet flat"><h4>Proctor — water % and wet density (g/cm³)</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>w %</th><th>ρ wet</th></tr></thead><tbody>${st.proctor.map(([wv, rho], i) => `<tr><td><input type="number" step="0.1" data-pw="${i}" value="${wv}"></td><td><input type="number" step="0.01" data-pr="${i}" value="${rho}"></td></tr>`).join("")}</tbody></table></div></section></div>`);
    const { c, fit } = S5.labCanvas(host, 300); const out = S5.labOut(host);
    const update = () => {
      host.querySelectorAll("[data-ret]").forEach((e) => (st.ret[+e.dataset.ret] = +e.value || 0)); host.querySelectorAll("[data-pw]").forEach((e) => (st.proctor[+e.dataset.pw][0] = +e.value)); host.querySelectorAll("[data-pr]").forEach((e) => (st.proctor[+e.dataset.pr][1] = +e.value));
      const total = st.ret.reduce((a, b) => a + b, 0) || 1; let cum = 0; const pass = sieves.slice(0, -1).map(([mm], i) => { cum += st.ret[i]; return [mm, 100 * (1 - cum / total)]; });
      const Dx = (pct) => { for (let i = 0; i < pass.length - 1; i++) { const [d1, p1] = pass[i], [d2, p2] = pass[i + 1]; if ((p1 - pct) * (p2 - pct) <= 0 && p1 !== p2) { const t = (pct - p1) / (p2 - p1); return Math.exp(Math.log(d1) + t * (Math.log(d2) - Math.log(d1))); } } return null; };
      const D10 = Dx(10), D30 = Dx(30), D60 = Dx(60); const Cu = D10 && D60 ? D60 / D10 : null, Cc = D10 && D30 && D60 ? (D30 * D30) / (D10 * D60) : null; const fines = pass[pass.length - 1][1]; const gravel = 100 - pass[0][1];
      const sand = gravel < 50 - 0; const well = sand ? Cu >= 6 && Cc >= 1 && Cc <= 3 : Cu >= 4 && Cc >= 1 && Cc <= 3; const cls = fines > 50 ? "Fine-grained (needs Atterberg limits)" : fines > 12 ? (sand ? "SM / SC" : "GM / GC") + " (needs Atterberg limits)" : fines < 5 ? (sand ? (well ? "SW — well-graded sand" : "SP — poorly graded sand") : well ? "GW — well-graded gravel" : "GP — poorly graded gravel") : "Dual symbol (5–12% fines)";
      // Proctor: dry density, quadratic fit, zero-air-voids
      const pts = st.proctor.map(([wv, rho]) => [wv, rho / (1 + wv / 100)]); const n = pts.length; let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0; pts.forEach(([a, b]) => { sx += a; sx2 += a * a; sx3 += a ** 3; sx4 += a ** 4; sy += b; sxy += a * b; sx2y += a * a * b; });
      const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const Mx = [[n, sx, sx2], [sx, sx2, sx3], [sx2, sx3, sx4]], D = det(Mx); const col = (i, v) => Mx.map((r, k) => r.map((q, j) => (j === i ? v[k] : q))); const vv = [sy, sxy, sx2y];
      const a0 = det(col(0, vv)) / D, a1 = det(col(1, vv)) / D, a2 = det(col(2, vv)) / D; const omc = a2 < 0 ? -a1 / (2 * a2) : null; const mdd = omc != null ? a0 + a1 * omc + a2 * omc * omc : null;
      const { x, w, h } = fit(); x.clearRect(0, 0, w, h); const ink = S5.cssVar("--ink"), red = S5.cssVar("--redline"), blue = S5.cssVar("--cobalt"), gr = S5.cssVar("--rule-strong");
      const half = w / 2 - 20;
      // gradation (semi-log)
      const lx = (d) => 40 + ((Math.log10(d) - Math.log10(0.05)) / (Math.log10(10) - Math.log10(0.05))) * (half - 50), ly = (p) => h - 30 - (p / 100) * (h - 60);
      x.strokeStyle = gr; x.strokeRect(40, 30, half - 50, h - 60); x.fillStyle = ink; x.font = "11px IBM Plex Mono"; x.fillText("% passing vs size (mm, log)", 44, 22);
      [0.075, 0.15, 0.3, 0.6, 1.18, 2.36, 4.75].forEach((d) => { x.fillText(String(d), lx(d) - 10, h - 14); x.strokeStyle = gr + "66"; x.beginPath(); x.moveTo(lx(d), 30); x.lineTo(lx(d), h - 30); x.stroke(); });
      x.strokeStyle = blue; x.lineWidth = 2.5; x.beginPath(); pass.forEach(([d, p], i) => (i ? x.lineTo(lx(d), ly(p)) : x.moveTo(lx(d), ly(p)))); x.stroke(); pass.forEach(([d, p]) => { x.fillStyle = blue; x.beginPath(); x.arc(lx(d), ly(p), 3.5, 0, 7); x.fill(); });
      // compaction
      const ox = half + 40, ow = w - ox - 20; const ws = pts.map((p) => p[0]); const wmin = Math.min(...ws) - 2, wmax = Math.max(...ws) + 2; const ds = pts.map((p) => p[1]); const dmin = Math.min(...ds) - 0.08, dmax = Math.max(...ds, mdd || 0) + 0.08;
      const cx = (v) => ox + ((v - wmin) / (wmax - wmin)) * ow, cy = (v) => h - 30 - ((v - dmin) / (dmax - dmin)) * (h - 60);
      x.strokeStyle = gr; x.lineWidth = 1; x.strokeRect(ox, 30, ow, h - 60); x.fillStyle = ink; x.fillText("dry density (g/cm³) vs water %", ox + 4, 22);
      x.strokeStyle = S5.cssVar("--graphite"); x.setLineDash([4, 4]); x.beginPath(); for (let v = wmin; v <= wmax; v += 0.2) { const zav = 2.65 / (1 + (v / 100) * 2.65); v === wmin ? x.moveTo(cx(v), cy(zav)) : x.lineTo(cx(v), cy(zav)); } x.stroke(); x.setLineDash([]); x.fillStyle = S5.cssVar("--graphite"); x.fillText("zero air voids", cx(wmax) - 90, cy(2.65 / (1 + (wmax / 100) * 2.65)) - 6);
      x.strokeStyle = red; x.lineWidth = 2.5; x.beginPath(); for (let v = wmin; v <= wmax; v += 0.2) { const yv = a0 + a1 * v + a2 * v * v; v === wmin ? x.moveTo(cx(v), cy(yv)) : x.lineTo(cx(v), cy(yv)); } x.stroke(); pts.forEach(([a, b]) => { x.fillStyle = red; x.beginPath(); x.arc(cx(a), cy(b), 4, 0, 7); x.fill(); });
      if (omc != null) { x.strokeStyle = ink; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(cx(omc), cy(mdd)); x.lineTo(cx(omc), h - 30); x.stroke(); x.setLineDash([]); x.fillStyle = ink; x.fillText(`OMC ${S5.round(omc, 1)}%`, cx(omc) + 4, h - 36); }
      out.innerHTML = kv([["D10 / D30 / D60", [D10, D30, D60].map((v) => (v ? S5.round(v, 3) : "—")).join(" / "), "mm"], ["Cu = D60/D10", Cu ? S5.round(Cu, 2) : "—"], ["Cc = D30²/(D10·D60)", Cc ? S5.round(Cc, 2) : "—"], ["Fines (passing #200)", S5.round(fines, 1) + "%"], ["Classification (USCS, coarse)", cls], ["Optimum moisture content", omc ? S5.round(omc, 1) + " %" : "fit failed — add points on both sides"], ["Maximum dry density", mdd ? S5.round(mdd, 3) + " g/cm³" : "—"]]) + `<p class="tiny muted">Gs = 2.65 assumed for the zero-air-voids line. Fine-grained soils need liquid & plastic limits for a full classification.</p>`;
      S5.labState.soil = { data: st, inputs: { retained: st.ret, proctor: st.proctor }, summary: `${cls}; OMC ${omc ? S5.round(omc, 1) : "—"}%, MDD ${mdd ? S5.round(mdd, 3) : "—"} g/cm³` };
    };
    host.addEventListener("input", (e) => { if (e.target.matches("[data-ret],[data-pw],[data-pr]")) update(); });
    update();
  },
  /* ---------- 6. Open channel flow ---------- */
  channel(host) {
    const read = S5.labControls(host, [["shape", "Section", 0, 0, 0, "trap", [["rect", "Rectangular"], ["trap", "Trapezoidal"]]], ["b", "Bed width b (m)", 0.5, 10, 0.1, 3], ["z", "Side slope z (H:1V)", 0, 3, 0.25, 1.5], ["y", "Water depth y (m)", 0.1, 3, 0.05, 1.2], ["S", "Bed slope S (‰)", 0.1, 10, 0.1, 1], ["n", "Manning n", 0.011, 0.04, 0.001, 0.025]], () => {});
    const { c, fit } = S5.labCanvas(host, 300); const out = S5.labOut(host); let t = 0, raf;
    const frame = () => {
      const p = read(); const z = p.shape === "rect" ? 0 : p.z; const A = (p.b + z * p.y) * p.y, P = p.b + 2 * p.y * Math.sqrt(1 + z * z), R = A / P, S = p.S / 1000; const V = (1 / p.n) * Math.pow(R, 2 / 3) * Math.sqrt(S); const Q = V * A; const T = p.b + 2 * z * p.y; const D = A / T; const Fr = V / Math.sqrt(9.81 * D);
      const { x, w, h } = fit(); x.clearRect(0, 0, w, h); const ink = S5.cssVar("--ink"), blue = S5.cssVar("--cobalt");
      const scale = Math.min((w * 0.45) / (p.b + 2 * z * 3.2), (h - 60) / 3.4); const cx = w * 0.25, base = h - 30;
      x.fillStyle = "#a8957a"; x.beginPath(); x.moveTo(cx - (p.b / 2 + z * 3.2) * scale - 20, base - 3.2 * scale); x.lineTo(cx - (p.b / 2) * scale, base); x.lineTo(cx + (p.b / 2) * scale, base); x.lineTo(cx + (p.b / 2 + z * 3.2) * scale + 20, base - 3.2 * scale); x.lineTo(cx + (p.b / 2 + z * 3.2) * scale + 20, base + 20); x.lineTo(cx - (p.b / 2 + z * 3.2) * scale - 20, base + 20); x.closePath(); x.fill();
      x.fillStyle = blue + "aa"; x.beginPath(); x.moveTo(cx - (p.b / 2) * scale, base); x.lineTo(cx + (p.b / 2) * scale, base); x.lineTo(cx + (p.b / 2 + z * p.y) * scale, base - p.y * scale); x.lineTo(cx - (p.b / 2 + z * p.y) * scale, base - p.y * scale); x.closePath(); x.fill();
      x.fillStyle = ink; x.font = "11px IBM Plex Mono"; x.fillText("cross-section", cx - 40, 18);
      // long section with moving particles (speed ∝ V)
      const lx0 = w * 0.55, lw = w * 0.42, ly = h * 0.55; x.fillStyle = "#a8957a"; x.fillRect(lx0, ly + 30, lw, 14); x.fillStyle = blue + "88"; x.fillRect(lx0, ly + 30 - p.y * 18, lw, p.y * 18);
      x.fillStyle = "#fff"; for (let i = 0; i < 26; i++) { const px = lx0 + ((i * 37 + t * V * 40) % lw); const py = ly + 30 - ((i * 13) % 10) / 10 * p.y * 18; x.fillRect(px, py, 3, 2); }
      x.fillStyle = ink; x.fillText(`V = ${S5.round(V, 2)} m/s → ${Fr < 1 ? "subcritical (tranquil)" : Fr > 1 ? "SUPERcritical (rapid)" : "critical"}`, lx0, ly - 24);
      out.innerHTML = kv([["Area A", S5.round(A, 3), "m²"], ["Wetted perimeter P", S5.round(P, 3), "m"], ["Hydraulic radius R", S5.round(R, 3), "m"], ["Velocity V", S5.round(V, 3), "m/s"], ["Discharge Q", S5.round(Q, 3), "m³/s"], ["Froude number", S5.round(Fr, 2), Fr < 1 ? "subcritical" : "supercritical"]]) + `<p class="tiny muted">Manning: V = (1/n) R^(2/3) S^(1/2); Fr = V / √(g·D), D = A/T.</p>`;
      S5.labState.channel = { inputs: p, summary: `${p.shape} b=${p.b} m, y=${p.y} m: Q ${S5.round(Q, 2)} m³/s, Fr ${S5.round(Fr, 2)}` };
      t += 1 / 60; if (c.isConnected) raf = requestAnimationFrame(frame);
    };
    frame(); return () => cancelAnimationFrame(raf);
  },
};

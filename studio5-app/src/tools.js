/* Engineering & studio tools, activated by academic year. Learning tools only: results show the formula used
   (formula provenance) and a plausibility note; they are never design approval. */
const R = S5.round;
const T_ = (rows) => `<div class="tbl-wrap"><table class="tbl"><tbody>${rows.map(([k, v, u = ""]) => `<tr><td>${k}</td><td class="num mono">${v}</td><td class="muted small">${u}</td></tr>`).join("")}</tbody></table></div>`;
const lines = (txt) => (txt || "").split(/\n/).map((l) => l.split(/[,;\t]/).map((x) => x.trim())).filter((r) => r.some((x) => x !== ""));
const warn = (t) => `<p class="small" style="color:var(--amber)">⚠ ${t}</p>`;
const ok = (t) => `<p class="small" style="color:var(--green)">✓ ${t}</p>`;
const formula = (t) => `<p class="tiny muted mono" style="margin-top:6px">Formula: ${t}</p>`;
const svgChart = (pts, { w = 520, h = 160, label = "", zero = true } = {}) => {
  if (!pts.length) return "";
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs); let y0 = Math.min(...ys, zero ? 0 : Infinity), y1 = Math.max(...ys, zero ? 0 : -Infinity); if (y1 === y0) { y1 += 1; y0 -= 1; }
  const pad = 28, X = (x) => pad + ((x - x0) / (x1 - x0 || 1)) * (w - pad * 2), Y = (y) => h - pad + 4 - ((y - y0) / (y1 - y0)) * (h - pad * 2);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
  const area = `${path}L${X(x1)},${Y(Math.max(y0, 0))}L${X(x0)},${Y(Math.max(y0, 0))}Z`;
  const mx = pts.reduce((a, p) => (Math.abs(p[1]) > Math.abs(a[1]) ? p : a), pts[0]);
  return `<div class="tbl-wrap"><svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px" role="img" aria-label="${label}">
    <line x1="${pad}" x2="${w - pad}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--rule-strong)"/>
    <path d="${area}" fill="var(--cobalt-wash)" stroke="none"/><path d="${path}" fill="none" stroke="var(--cobalt)" stroke-width="2"/>
    <circle cx="${X(mx[0])}" cy="${Y(mx[1])}" r="3.5" fill="var(--cobalt)"/><text x="${X(mx[0]) + 6}" y="${Y(mx[1]) - 6}" font-size="11" fill="var(--ink)" font-family="IBM Plex Mono">${R(mx[1], 2)}</text>
    <text x="${pad}" y="14" font-size="11" fill="var(--graphite)" font-family="IBM Plex Mono">${label}</text>
    <text x="${pad}" y="${h - 4}" font-size="10" fill="var(--graphite)" font-family="IBM Plex Mono">${R(x0, 2)}</text><text x="${w - pad}" y="${h - 4}" font-size="10" text-anchor="end" fill="var(--graphite)" font-family="IBM Plex Mono">${R(x1, 2)}</text>
  </svg></div>`;
};
S5.TOOL_DEFS = {
  scale: {
    inputs: [["n", "Scale 1 :", 50], ["real", "Real length (m)", 4.2], ["paper", "Measured on paper (mm)", ""]],
    run(v) {
      const n = S5.num(v.n, 50), real = S5.num(v.real), paper = S5.num(v.paper);
      const rows = [["Real → paper", R((real * 1000) / n, 1) + " mm", `${real} m at 1:${n}`]];
      if (paper) rows.push(["Paper → real", R((paper * n) / 1000, 3) + " m", `${paper} mm at 1:${n}`]);
      const sheets = [["A3", 420, 297], ["A2", 594, 420], ["A1", 841, 594]].map(([s, w, h]) => [`${s} sheet covers`, `${R(((w - 40) * n) / 1000, 1)} × ${R(((h - 40) * n) / 1000, 1)} m`, "minus 20 mm margins"]);
      return T_(rows.concat(sheets)) + formula("paper(mm) = real(m) × 1000 ÷ n");
    },
  },
  beam: {
    inputs: [["L", "Span L (m)", 5], ["w", "Uniform load w (kN/m)", 12], ["P", "Point load P (kN)", 0], ["a", "P at distance a (m)", 2.5], ["E", "E (GPa)", 25], ["I", "I (cm⁴)", 52000]],
    run(v) {
      const L = S5.num(v.L, 5), w = S5.num(v.w), P = S5.num(v.P), a = S5.clamp(S5.num(v.a), 0, L), E = S5.num(v.E, 25) * 1e6, I = S5.num(v.I, 1) * 1e-8;
      const b = L - a, RB = (w * L) / 2 + (P * a) / L, RA = w * L + P - RB;
      const N = 80, V = [], M = []; let Mmax = 0, xm = 0;
      for (let i = 0; i <= N; i++) { const x = (L * i) / N; const v_ = RA - w * x - (x > a ? P : 0); const m_ = RA * x - (w * x * x) / 2 - (x > a ? P * (x - a) : 0); V.push([x, v_]); M.push([x, m_]); if (Math.abs(m_) > Math.abs(Mmax)) { Mmax = m_; xm = x; } }
      const dU = (5 * w * L ** 4) / (384 * E * I); const x = L / 2; const dP = a <= x ? (P * a * (3 * L * L - 4 * a * a)) / (48 * E * I) : (P * b * (3 * L * L - 4 * b * b)) / (48 * E * I);
      const dMid = (dU + dP) * 1000; const lim = (L * 1000) / 250;
      return T_([["Reaction A", R(RA, 2), "kN"], ["Reaction B", R(RB, 2), "kN"], ["Max shear", R(Math.max(Math.abs(RA), Math.abs(RB)), 2), "kN"], ["Max moment", R(Mmax, 2), `kN·m at x = ${R(xm, 2)} m`], ["Mid-span deflection", R(dMid, 2), "mm"], ["Limit L/250", R(lim, 1), "mm"]])
        + (dMid > lim ? warn("Deflection exceeds L/250 — section too flexible for this span (learning check).") : ok("Deflection within L/250."))
        + svgChart(V, { label: "Shear force V (kN)" }) + svgChart(M, { label: "Bending moment M (kN·m)" })
        + formula("R_B = wL/2 + Pa/L; M(x) = R_A·x − wx²/2 − P⟨x−a⟩; δ = 5wL⁴/384EI + Pa(3L²−4a²)/48EI (a ≤ L/2)");
    },
  },
  section: {
    inputs: [["shape", "Shape (rect / I)", "rect"], ["b", "b or flange width (mm)", 250], ["h", "h or overall depth (mm)", 500], ["tf", "Flange thickness (mm, I only)", 12], ["tw", "Web thickness (mm, I only)", 8]],
    run(v) {
      const b = S5.num(v.b), h = S5.num(v.h), tf = S5.num(v.tf), tw = S5.num(v.tw); let A, I;
      if ((v.shape || "").toLowerCase().startsWith("i")) { const hw = h - 2 * tf; A = 2 * b * tf + hw * tw; I = (b * h ** 3 - (b - tw) * hw ** 3) / 12; } else { A = b * h; I = (b * h ** 3) / 12; }
      const Z = I / (h / 2), r = Math.sqrt(I / A);
      return T_([["Area A", R(A / 100, 2), "cm²"], ["Second moment Ixx", R(I / 1e4, 1), "cm⁴"], ["Section modulus Zxx", R(Z / 1e3, 1), "cm³"], ["Radius of gyration r", R(r / 10, 2), "cm"]]) + formula("Rect: I = bh³/12; I-section: I = [bh³ − (b−tw)(h−2tf)³]/12; Z = I/(h/2); r = √(I/A)");
    },
  },
  stats: {
    inputs: [["data", "Values (comma or new line)", "62, 71, 55, 80, 68, 74, 90, 66, 59, 77", "textarea"]],
    run(v) {
      const xs = (v.data || "").split(/[\s,;]+/).map(parseFloat).filter(Number.isFinite).sort((a, b) => a - b); const n = xs.length; if (!n) return warn("Enter numbers.");
      const mean = xs.reduce((a, b) => a + b, 0) / n; const q = (p) => { const i = (n - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return xs[lo] + (xs[hi] - xs[lo]) * (i - lo); };
      const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
      const bins = Math.max(3, Math.min(10, Math.round(Math.sqrt(n)))); const w = (xs[n - 1] - xs[0]) / bins || 1; const hist = Array(bins).fill(0); xs.forEach((x) => hist[Math.min(bins - 1, Math.floor((x - xs[0]) / w))]++); const hm = Math.max(...hist);
      return T_([["n", n], ["Mean", R(mean, 3)], ["Median", R(q(0.5), 3)], ["Std. deviation (sample)", R(sd, 3)], ["Min / Max", `${xs[0]} / ${xs[n - 1]}`], ["Q1 / Q3", `${R(q(0.25), 2)} / ${R(q(0.75), 2)}`], ["Coefficient of variation", R((sd / mean) * 100, 1) + " %"]])
        + `<div class="bar-chart" style="margin-top:10px">${hist.map((c, i) => `<div class="bar-row"><span class="mono tiny">${R(xs[0] + i * w, 1)}–${R(xs[0] + (i + 1) * w, 1)}</span>${S5.h.meter((c / hm) * 100)}<span class="mono tiny">${c}</span></div>`).join("")}</div>` + formula("s = √(Σ(x−x̄)²/(n−1)); quartiles by linear interpolation");
    },
  },
  stairs: {
    inputs: [["H", "Floor-to-floor height (mm)", 3200], ["r", "Preferred riser (mm)", 160], ["width", "Stair width (mm)", 1200], ["landing", "Landings (count)", 1]],
    run(v) {
      const H = S5.num(v.H, 3200), r0 = S5.num(v.r, 160); const n = Math.round(H / r0); const R_ = H / n; const G = 630 - 2 * R_; const goings = n - 1 - S5.num(v.landing, 1); const run = Math.max(0, goings) * G; const ang = (Math.atan(R_ / G) * 180) / Math.PI;
      const blondel = 2 * R_ + G;
      return T_([["Risers", n], ["Riser height R", R(R_, 1), "mm"], ["Going G (2R + G = 630)", R(G, 0), "mm"], ["Treads in flights", goings], ["Horizontal run (excl. landings)", R(run / 1000, 2), "m"], ["Pitch", R(ang, 1), "°"], ["Blondel check 2R+G", R(blondel, 0), "mm (600–640)"]])
        + (R_ > 180 ? warn("Riser above 180 mm is steep for public stairs.") : ok("Riser in a comfortable range.")) + (ang > 38 ? warn("Pitch above ~38° is too steep for a normal stair.") : "") + (n > 16 ? warn("More than 16 risers in one flight: add a landing.") : "")
        + formula("n = round(H ÷ R₀); R = H ÷ n; G = 630 − 2R (Blondel); pitch = atan(R/G). Check against the code your professor uses.");
    },
  },
  levelling: {
    inputs: [["rl", "Benchmark RL (m)", 100.000], ["book", "Rows: BS, IS, FS, remark", "1.525,,,BM\n,1.800,,A\n,2.105,,B\n0.985,,1.640,TP1\n,1.230,,C\n,,2.010,D", "textarea"]],
    run(v) {
      let rl = S5.num(v.rl, 100); const rows = lines(v.book); let prev = null; let sBS = 0, sFS = 0, sR = 0, sF = 0; const out = []; const first = rl;
      for (const [bs, is, fs, rem] of rows) {
        const B = parseFloat(bs), I = parseFloat(is), F = parseFloat(fs); let rise = "", fall = "";
        const reading = Number.isFinite(F) ? F : Number.isFinite(I) ? I : null;
        if (prev != null && reading != null) { const d = prev - reading; if (d >= 0) { rise = d; sR += d; } else { fall = -d; sF -= d; } rl += d; }
        if (Number.isFinite(B)) sBS += B; if (Number.isFinite(F)) sFS += F;
        out.push([bs || "", is || "", fs || "", rise === "" ? "" : rise.toFixed(3), fall === "" ? "" : fall.toFixed(3), rl.toFixed(3), rem || ""]);
        prev = Number.isFinite(B) ? B : reading;
      }
      const c1 = sBS - sFS, c2 = sR - sF, c3 = rl - first; const okc = Math.abs(c1 - c2) < 0.0005 && Math.abs(c2 - c3) < 0.0005;
      return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>BS</th><th>IS</th><th>FS</th><th>Rise</th><th>Fall</th><th>RL</th><th>Remark</th></tr></thead><tbody>${out.map((r) => `<tr>${r.map((c, i) => `<td class="${i < 6 ? "num mono" : ""}">${S5.esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
        + T_([["ΣBS − ΣFS", c1.toFixed(3)], ["ΣRise − ΣFall", c2.toFixed(3)], ["Last RL − First RL", c3.toFixed(3)]]) + (okc ? ok("Arithmetic check passes.") : warn("Arithmetic check fails — recheck the readings.")) + formula("Rise/Fall = previous reading − current reading; check ΣBS−ΣFS = ΣRise−ΣFall = RL_last − RL_first");
    },
  },
  curve: {
    inputs: [["R", "Radius R (m)", 300], ["D", "Deflection angle Δ (°)", 32], ["PI", "Chainage of PI (m)", 1250], ["V", "Design speed (km/h)", 80], ["e", "Superelevation e", 0.06], ["f", "Side friction f", 0.14]],
    run(v) {
      const Rr = S5.num(v.R), D = (S5.num(v.D) * Math.PI) / 180, PI = S5.num(v.PI), V = S5.num(v.V), e = S5.num(v.e), f = S5.num(v.f);
      const T = Rr * Math.tan(D / 2), L = Rr * D, E = Rr * (1 / Math.cos(D / 2) - 1), M = Rr * (1 - Math.cos(D / 2)), Rmin = (V * V) / (127 * (e + f));
      return T_([["Tangent length T", R(T, 3), "m"], ["Curve length L", R(L, 3), "m"], ["External distance E", R(E, 3), "m"], ["Middle ordinate M", R(M, 3), "m"], ["Chainage PC", R(PI - T, 3), "m"], ["Chainage PT", R(PI - T + L, 3), "m"], ["Minimum radius for V", R(Rmin, 1), "m"]])
        + (Rr < Rmin ? warn("Radius is below the minimum for this design speed.") : ok("Radius is above the minimum for this speed.")) + formula("T = R tan(Δ/2); L = RΔ; E = R(sec(Δ/2) − 1); M = R(1 − cos(Δ/2)); R_min = V²/127(e+f)");
    },
  },
  lux: {
    inputs: [["L", "Room length (m)", 8], ["W", "Room width (m)", 6], ["Hm", "Luminaire height above work plane (m)", 2.2], ["E", "Required illuminance (lux)", 500], ["F", "Lumens per luminaire", 3600], ["MF", "Maintenance factor", 0.8]],
    run(v) {
      const L = S5.num(v.L), W = S5.num(v.W), Hm = S5.num(v.Hm, 2.2), E = S5.num(v.E), F = S5.num(v.F, 3600), MF = S5.num(v.MF, 0.8);
      const k = (L * W) / (Hm * (L + W)); const UF = S5.clamp(0.28 + 0.12 * Math.log2(Math.max(k, 0.5)) + 0.1, 0.3, 0.75);
      const N = Math.ceil((E * L * W) / (F * UF * MF)); const cols = Math.max(1, Math.round(Math.sqrt((N * L) / W))); const rows_ = Math.ceil(N / cols);
      return T_([["Room index k", R(k, 2)], ["Utilisation factor (approx.)", R(UF, 2), "from typical tables — use the manufacturer's"], ["Luminaires needed N", N], ["Suggested grid", `${cols} × ${rows_}`], ["Spacing", `${R(L / cols, 2)} × ${R(W / rows_, 2)} m`], ["Max spacing ≈ 1.5 × Hm", R(1.5 * Hm, 2), "m"]])
        + (L / cols > 1.5 * Hm ? warn("Spacing too wide for even lighting; add luminaires.") : "") + formula("N = E·A ÷ (F·UF·MF); k = LW ÷ Hm(L+W)");
    },
  },
  reverb: {
    inputs: [["V", "Room volume (m³)", 600], ["use", "Use (speech / music / multi)", "speech"], ["surf", "Surfaces: area m², absorption α", "220, 0.02\n120, 0.30\n90, 0.05\n60, 0.70", "textarea"]],
    run(v) {
      const V = S5.num(v.V); const A = lines(v.surf).reduce((a, [s, al]) => a + S5.num(s) * S5.num(al), 0); const RT = (0.161 * V) / (A || 1);
      const target = { speech: [0.6, 1.0], music: [1.4, 2.0], multi: [0.9, 1.4] }[(v.use || "speech").toLowerCase()] || [0.6, 1.0];
      return T_([["Total absorption A", R(A, 2), "m² sabins"], ["Reverberation time RT60", R(RT, 2), "s"], ["Target for " + (v.use || "speech"), `${target[0]}–${target[1]}`, "s"], ["Absorption to reach target", R(Math.max(0, (0.161 * V) / target[1] - A), 1), "m² more"]])
        + (RT > target[1] ? warn("Too reverberant for this use.") : RT < target[0] ? warn("Too dead for this use.") : ok("Within the target range.")) + formula("RT = 0.161 V ÷ Σ(Sα) (Sabine)");
    },
  },
  water: {
    inputs: [["p", "Occupants", 6], ["q", "Demand per person (L/day)", 200], ["days", "Storage (days)", 1.5], ["peak", "Peak factor", 2.5]],
    run(v) {
      const p = S5.num(v.p), q = S5.num(v.q, 200), d = S5.num(v.days, 1), pk = S5.num(v.peak, 2.5); const daily = p * q;
      return T_([["Daily demand", R(daily, 0), "L/day"], ["Storage volume", R((daily * d) / 1000, 2), "m³"], ["Peak flow", R((daily * pk) / 86400, 3), "L/s"], ["Roof tank (≈ 1/3 of storage)", R((daily * d) / 3000, 2), "m³"]]) + formula("V = persons × L/person/day × days; Q_peak = daily × peak factor ÷ 86 400");
    },
  },
  boq: {
    inputs: [["items", "Items: description, unit, qty, rate (IQD)", "Excavation, m³, 42, 9000\nPlain concrete C15, m³, 6.5, 120000\nBrickwork 24 cm, m², 180, 28000\nPlaster, m², 360, 7000", "textarea"], ["cont", "Contingency %", 10], ["wallL", "Brick helper: wall length (m)", 0], ["wallH", "wall height (m)", 3], ["open", "openings area (m²)", 0]],
    run(v) {
      const rows = lines(v.items).map(([d, u, q, r]) => ({ d, u, q: S5.num(q), r: S5.num(r) })); const tot = rows.reduce((a, x) => a + x.q * x.r, 0); const c = (tot * S5.num(v.cont)) / 100;
      let brick = "";
      if (S5.num(v.wallL)) { const area = S5.num(v.wallL) * S5.num(v.wallH) - S5.num(v.open); const perM2 = 1 / ((0.24 + 0.01) * (0.075 + 0.01)); brick = T_([["Net wall area", R(area, 2), "m²"], ["Bricks per m² (stretcher face 24 × 7.5 + 10 mm joints)", R(perM2, 1)], ["Bricks for half-brick wall (+5% waste)", Math.ceil(area * perM2 * 1.05)], ["Bricks for one-brick (24 cm) wall", Math.ceil(area * perM2 * 2 * 1.05)]]); }
      return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows.map((x) => `<tr><td dir="auto">${S5.esc(x.d)}</td><td>${S5.esc(x.u)}</td><td class="num mono">${x.q}</td><td class="num mono">${x.r.toLocaleString()}</td><td class="num mono">${Math.round(x.q * x.r).toLocaleString()}</td></tr>`).join("")}
        <tr><td colspan="4"><b>Subtotal</b></td><td class="num mono"><b>${Math.round(tot).toLocaleString()}</b></td></tr><tr><td colspan="4">Contingency ${v.cont}%</td><td class="num mono">${Math.round(c).toLocaleString()}</td></tr><tr><td colspan="4"><b>Total (IQD)</b></td><td class="num mono"><b>${Math.round(tot + c).toLocaleString()}</b></td></tr></tbody></table></div>${brick}` + formula("Amount = qty × rate; rates are your inputs, not market data");
    },
  },
  sun: {
    inputs: [["lat", "Latitude (°N)", 35.47], ["date", "Date", S5.todayISO(), "date"], ["time", "Solar time (h)", 12], ["win", "Window height (m)", 1.5], ["face", "Facade facing (S/E/W/N)", "S"]],
    run(v) {
      const lat = (S5.num(v.lat, 35.47) * Math.PI) / 180; const d = new Date((v.date || S5.todayISO()) + "T12:00:00"); const doy = Math.round((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
      const dec = ((23.45 * Math.sin(((360 / 365) * (284 + doy) * Math.PI) / 180)) * Math.PI) / 180;
      const pos = (t) => { const H = ((15 * (t - 12)) * Math.PI) / 180; const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H)); let az = Math.acos(S5.clamp((Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat)), -1, 1)); if (H > 0) az = 2 * Math.PI - az; return [alt, az]; };
      const t = S5.num(v.time, 12); const [alt, az] = pos(t); const altD = (alt * 180) / Math.PI, azD = (az * 180) / Math.PI;
      const faceAz = { S: 180, E: 90, W: 270, N: 0 }[(v.face || "S").toUpperCase()] ?? 180; const rel = ((azD - faceAz) * Math.PI) / 180;
      const profile = Math.atan(Math.tan(alt) / Math.max(0.01, Math.cos(rel))); const overhang = S5.num(v.win, 1.5) / Math.tan(profile);
      const curve = []; for (let h = 5; h <= 19; h += 0.25) { const a = (pos(h)[0] * 180) / Math.PI; if (a > -5) curve.push([h, R(a, 1)]); }
      const sunrise = 12 - (Math.acos(S5.clamp(-Math.tan(lat) * Math.tan(dec), -1, 1)) * 180) / Math.PI / 15;
      return T_([["Day of year", doy], ["Declination", R((dec * 180) / Math.PI, 2), "°"], ["Sun altitude", R(altD, 1), "°"], ["Sun azimuth (from N, clockwise)", R(azD, 1), "°"], ["Sunrise / sunset (solar)", `${R(sunrise, 2)} / ${R(24 - sunrise, 2)}`, "h"], ["Overhang to shade full window now", Math.cos(rel) > 0 && altD > 0 ? R(overhang, 2) + " m" : "sun not on this facade", ""]])
        + svgChart(curve, { label: "Sun altitude through the day (°)", zero: false }) + formula("δ = 23.45 sin(360(284+n)/365); sin α = sin φ sin δ + cos φ cos δ cos h; overhang = H ÷ tan(profile angle)");
    },
  },
  uvalue: {
    inputs: [["layers", "Layers: name, thickness (mm), k (W/m·K)", "Cement plaster, 20, 0.72\nClay brick, 240, 0.62\nAir gap / insulation, 50, 0.035\nGypsum plaster, 15, 0.40", "textarea"], ["rsi", "Rsi (m²K/W)", 0.13], ["rso", "Rso (m²K/W)", 0.04]],
    run(v) {
      const L = lines(v.layers).map(([n, t, k]) => ({ n, R: S5.num(t) / 1000 / (S5.num(k) || 1) })); const Rt = L.reduce((a, x) => a + x.R, 0) + S5.num(v.rsi) + S5.num(v.rso); const U = 1 / Rt;
      return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Layer</th><th class="num">R (m²K/W)</th></tr></thead><tbody>${L.map((x) => `<tr><td dir="auto">${S5.esc(x.n)}</td><td class="num mono">${R(x.R, 3)}</td></tr>`).join("")}</tbody></table></div>` + T_([["Total R", R(Rt, 3), "m²K/W"], ["U-value", R(U, 3), "W/m²K"]]) + (U > 0.6 ? warn("High U-value for a hot-dry climate external wall; consider insulation.") : ok("Reasonable thermal resistance.")) + formula("R = d ÷ k; U = 1 ÷ (Rsi + ΣR + Rso)");
    },
  },
  housing: {
    inputs: [["ha", "Site area (ha)", 4.5], ["du", "Dwellings", 180], ["pp", "Persons per dwelling", 6], ["gfa", "Total floor area (m²)", 32000]],
    run(v) { const ha = S5.num(v.ha, 1), du = S5.num(v.du), pp = S5.num(v.pp, 6), gfa = S5.num(v.gfa); return T_([["Gross density", R(du / ha, 1), "dwellings/ha"], ["Population density", R((du * pp) / ha, 0), "persons/ha"], ["Floor area ratio (FAR)", R(gfa / (ha * 10000), 2)], ["Land per dwelling", R((ha * 10000) / du, 1), "m²"]]) + formula("density = dwellings ÷ ha; FAR = GFA ÷ site area"); },
  },
  gantt: {
    inputs: [["tasks", "Tasks: id, name, days, predecessors (space-separated)", "A, Brief & site analysis, 4,\nB, Program & relations, 3, A\nC, Alternatives, 5, B\nD, Structure check, 2, C\nE, Drawings, 6, C\nF, Render & board, 4, D E\nG, Print & submit, 1, F", "textarea"]],
    run(v) {
      const ts = lines(v.tasks).map(([id, name, d, pre]) => ({ id, name, d: S5.num(d), pre: (pre || "").split(/\s+/).filter(Boolean) })); const by = Object.fromEntries(ts.map((t) => [t.id, t]));
      const order = []; const seen = new Set(); const visit = (t, stack = new Set()) => { if (seen.has(t.id)) return; if (stack.has(t.id)) throw new Error("Cycle at " + t.id); stack.add(t.id); t.pre.forEach((p) => by[p] && visit(by[p], stack)); seen.add(t.id); order.push(t); };
      try { ts.forEach((t) => visit(t)); } catch (e) { return warn(e.message); }
      order.forEach((t) => { t.es = Math.max(0, ...t.pre.map((p) => by[p]?.ef || 0)); t.ef = t.es + t.d; });
      const end = Math.max(...order.map((t) => t.ef)); [...order].reverse().forEach((t) => { const succ = ts.filter((s) => s.pre.includes(t.id)); t.lf = succ.length ? Math.min(...succ.map((s) => s.ls)) : end; t.ls = t.lf - t.d; t.fl = t.ls - t.es; });
      return `<p><b>Project duration: ${end} days.</b> Critical path: ${order.filter((t) => t.fl === 0).map((t) => t.id).join(" → ")}</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Task</th><th class="num">ES</th><th class="num">EF</th><th class="num">LS</th><th class="num">Float</th><th style="min-width:240px">Timeline</th></tr></thead><tbody>${order.map((t) => `<tr><td>${S5.esc(t.id)} · ${S5.esc(t.name)}</td><td class="num mono">${t.es}</td><td class="num mono">${t.ef}</td><td class="num mono">${t.ls}</td><td class="num mono">${t.fl}</td><td><div style="position:relative;height:14px;background:var(--paper-2);border-radius:3px"><i style="position:absolute;left:${(t.es / end) * 100}%;width:${(t.d / end) * 100}%;top:0;bottom:0;border-radius:3px;background:${t.fl === 0 ? "var(--redline)" : "var(--cobalt)"}"></i></div></td></tr>`).join("")}</tbody></table></div>` + formula("Forward pass ES = max(EF of predecessors); backward pass LF = min(LS of successors); float = LS − ES");
    },
  },
  npv: {
    inputs: [["rate", "Discount rate %", 8], ["flows", "Cash flows year 0, 1, 2… (negative = cost)", "-500000, 120000, 140000, 150000, 150000, 160000", "textarea"]],
    run(v) {
      const r = S5.num(v.rate) / 100; const cf = (v.flows || "").split(/[\s,;]+/).map(parseFloat).filter(Number.isFinite);
      const npv = (rr) => cf.reduce((a, c, t) => a + c / (1 + rr) ** t, 0);
      let lo = -0.99, hi = 5, irr = null; if (npv(lo) * npv(hi) < 0) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (npv(lo) * npv(m) <= 0) hi = m; else lo = m; } irr = (lo + hi) / 2; }
      let cum = 0, pb = null; cf.forEach((c, t) => { const prev = cum; cum += c; if (pb == null && prev < 0 && cum >= 0) pb = t - 1 + -prev / c; });
      return T_([["NPV", Math.round(npv(r)).toLocaleString()], ["IRR", irr == null ? "n/a" : R(irr * 100, 2) + " %"], ["Simple payback", pb == null ? "not reached" : R(pb, 2) + " years"]]) + (npv(r) >= 0 ? ok("Positive NPV at this rate.") : warn("Negative NPV at this rate.")) + formula("NPV = Σ CFₜ ÷ (1+r)ᵗ; IRR solves NPV = 0 (bisection)");
    },
  },
  lcc: {
    inputs: [["rate", "Discount rate %", 6], ["years", "Study period (years)", 25], ["alts", "Alternatives: name, initial cost, annual cost", "Single glazing, 3000000, 900000\nDouble glazing, 5200000, 520000", "textarea"]],
    run(v) {
      const r = S5.num(v.rate) / 100, n = S5.num(v.years, 25); const pwf = r ? (1 - (1 + r) ** -n) / r : n;
      const alts = lines(v.alts).map(([nm, ic, ac]) => ({ nm, pw: S5.num(ic) + S5.num(ac) * pwf })); const best = alts.reduce((a, b) => (b.pw < a.pw ? b : a), alts[0] || { pw: 0 });
      return T_(alts.map((a) => [S5.esc(a.nm) + (a === best ? " ✓" : ""), Math.round(a.pw).toLocaleString(), "present worth"])) + formula(`PW = initial + annual × [(1 − (1+r)⁻ⁿ) ÷ r], factor = ${R(pwf, 3)}`);
    },
  },
};
S5.renderTool = (key, saved) => {
  const def = S5.TOOL_DEFS[key]; const vals = saved?.inputs || Object.fromEntries(def.inputs.map(([k, , d]) => [k, d]));
  const inputs = def.inputs.map(([k, label, , kind]) => kind === "textarea" ? `<label class="field wide"><span>${label}</span><textarea data-tool-in="${k}" rows="6" dir="auto" style="font-family:var(--f-mono);font-size:.82rem">${S5.esc(vals[k])}</textarea></label>` : `<label class="field"><span>${label}</span><input data-tool-in="${k}" ${kind === "date" ? 'type="date"' : ""} value="${S5.esc(vals[k])}" dir="auto"></label>`).join("");
  let out = ""; try { out = def.run(vals); } catch (e) { out = warn("Check the inputs: " + S5.esc(e.message)); }
  return `<div class="form-grid" data-tool="${key}">${inputs}</div><div class="tool-out" style="margin-top:14px">${out}</div><p class="tiny muted" style="margin-top:8px">Learning tool. Results support understanding and checking homework; they are not approval for design or construction.</p>`;
};
S5.bindTool = (root, key) => {
  const grid = root.querySelector(`[data-tool="${key}"]`); if (!grid) return;
  const read = () => Object.fromEntries([...grid.querySelectorAll("[data-tool-in]")].map((e) => [e.dataset.toolIn, e.value]));
  const upd = S5.debounce(() => { let out; try { out = S5.TOOL_DEFS[key].run(read()); } catch (e) { out = warn("Check the inputs: " + S5.esc(e.message)); } root.querySelector(".tool-out").innerHTML = out; }, 250);
  grid.addEventListener("input", upd);
  return read;
};

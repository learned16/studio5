/* Virtual Architecture Studio — 3D massing with real sun & shadows, a perspective machine, and a
   composition & colour lab. Scenes are saved per project and can be built from the project's program. */
S5.ATELIER = [["massing", "3D massing & sun", "الكتل ثلاثية الأبعاد والشمس"], ["persp", "Perspective machine", "آلة المنظور"], ["compose", "Composition & colour", "التكوين واللون"]];
S5.views.atelier = (r) => {
  const tool = r.id || "massing";
  S5.ui.mount(() => S5.ATELIER_RUN[tool] && S5.ATELIER_RUN[tool](document.getElementById("at-stage"), r));
  return `<div class="crumbs"><button data-act="open" data-v="practice" data-tab="coach">Practice</button></div>
  <div class="page-head"><div class="titles"><span class="eyebrow">Virtual design studio</span><h1>Design studio</h1></div></div>
  <div class="seg" style="margin-bottom:12px">${S5.ATELIER.map(([k, en]) => `<button data-act="open" data-v="atelier" data-id="${k}" aria-pressed="${k === tool}">${S5.esc(en)}</button>`).join("")}</div>
  <div id="at-stage"></div>`;
};
S5.sunPos = (latDeg, dateISO, hour) => {
  const lat = (latDeg * Math.PI) / 180; const d = new Date(dateISO + "T12:00:00"); const doy = Math.round((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const dec = ((23.45 * Math.sin(((360 / 365) * (284 + doy) * Math.PI) / 180)) * Math.PI) / 180; const H = ((15 * (hour - 12)) * Math.PI) / 180;
  const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
  let az = Math.acos(S5.clamp((Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat)), -1, 1)); if (H > 0) az = 2 * Math.PI - az;
  return { alt, az };
};
S5.ATELIER_RUN = {
  massing(host, r) {
    if (!window.THREE) { host.innerHTML = H.empty("The 3D engine did not load.", "Check your connection and reopen this page."); return; }
    const T = window.THREE; const projects = S5.store.list("project");
    const scene0 = (r.scene && S5.store.get(r.scene)) || S5.store.list("massing").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const st = { id: scene0?.id || null, name: scene0?.name || "Massing study", projectId: scene0?.projectId || "", boxes: (scene0?.boxes || [{ id: "b1", x: 0, z: 0, w: 12, d: 8, h: 3.5, rot: 0, label: "Pavilion", color: "#e8e1d4" }, { id: "b2", x: 10, z: -6, w: 6, d: 6, h: 7, rot: 0.3, label: "Tower", color: "#d9dfe8" }]).map((b) => ({ ...b })), sel: null, north: scene0?.north || 0 };
    host.innerHTML = `<div class="split" style="grid-template-columns:minmax(0,2.2fr) minmax(260px,1fr)"><div class="stack">
        <div id="m3d" style="position:relative;height:min(64vh,560px);border-radius:10px;overflow:hidden;border:1px solid var(--rule-strong);touch-action:none;background:#cfd8e3"></div>
        <div class="row"><label class="small row" style="gap:6px;flex:1;min-width:220px">Time <input type="range" id="m-time" min="5" max="19.5" step="0.05" value="10" style="flex:1"><b class="mono" id="m-time-v">10:00</b></label><button class="btn sm" id="m-play">▶ Day</button><input type="date" id="m-date" value="${S5.todayISO().slice(0, 4)}-06-21"><label class="small">Lat <input id="m-lat" type="number" step="0.01" value="${S5.settings.get("lat")}" style="width:72px"></label></div>
      </div><div class="stack">
        <section class="sheet"><div class="row"><input id="m-name" value="${S5.esc(st.name)}" dir="auto" style="flex:1;min-width:0;padding:6px;border:1px solid var(--rule);border-radius:6px;background:var(--paper)"></div>
          <div class="row" style="margin-top:8px"><select id="m-proj" style="flex:1"><option value="">— Project —</option>${projects.map((p) => `<option value="${p.id}" ${p.id === st.projectId ? "selected" : ""}>${S5.esc(p.name)}</option>`).join("")}</select></div>
          <div class="row" style="margin-top:8px"><button class="btn sm primary" id="m-add">+ Mass</button><button class="btn sm" id="m-prog">From project program</button><button class="btn sm" id="m-save">Save</button><button class="btn sm" id="m-png">PNG</button></div>
          <div class="row" style="margin-top:8px"><button class="btn sm" id="m-top">Top view</button><button class="btn sm" id="m-persp">3D view</button><label class="small row" style="gap:4px">North ° <input id="m-north" type="number" value="${st.north}" style="width:60px"></label></div></section>
        <section class="sheet" id="m-edit"></section>
        <section class="sheet"><h4>Sun now</h4><div id="m-sun" class="small mono"></div><p class="tiny muted" style="margin-top:6px">Drag on empty ground to orbit, wheel / pinch to zoom, drag a mass to move it. Shadows use the real sun position for the latitude, date and solar time.</p></section>
      </div></div>`;
    const el = host.querySelector("#m3d"); const W = () => el.clientWidth, Hh = () => el.clientHeight;
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W(), Hh()); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; el.appendChild(renderer.domElement);
    const scene = new T.Scene(); scene.background = new T.Color(0xcfd8e3); scene.fog = new T.Fog(0xcfd8e3, 160, 420);
    const cam = new T.PerspectiveCamera(45, W() / Hh(), 0.5, 1000); let orbit = { r: 70, th: -0.8, ph: 0.85, tx: 0, tz: 0 }, top = false;
    const placeCam = () => { if (top) { cam.position.set(orbit.tx, orbit.r * 1.3, orbit.tz + 0.01); cam.lookAt(orbit.tx, 0, orbit.tz); } else { cam.position.set(orbit.tx + orbit.r * Math.sin(orbit.ph) * Math.cos(orbit.th), orbit.r * Math.cos(orbit.ph), orbit.tz + orbit.r * Math.sin(orbit.ph) * Math.sin(orbit.th)); cam.lookAt(orbit.tx, 0, orbit.tz); } };
    scene.add(new T.HemisphereLight(0xdfe9f5, 0x8a7d66, 0.55));
    const sun = new T.DirectionalLight(0xfff3df, 1.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 400 }); scene.add(sun); scene.add(sun.target);
    const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const grid = new T.GridHelper(200, 100, 0x9a927f, 0xbfb6a3); grid.position.y = 0.01; scene.add(grid);
    const northArrow = new T.Group(); const arrowMesh = new T.Mesh(new T.ConeGeometry(1.2, 4, 3), new T.MeshStandardMaterial({ color: 0xb8392a })); arrowMesh.rotation.x = -Math.PI / 2; arrowMesh.position.set(0, 0.2, -2); northArrow.add(arrowMesh); northArrow.position.set(-40, 0, 40); scene.add(northArrow);
    const meshes = new Map(); const mat = (c, sel) => new T.MeshStandardMaterial({ color: new T.Color(c), roughness: 0.85, emissive: sel ? 0x1f4fa8 : 0x000000, emissiveIntensity: sel ? 0.25 : 0 });
    const label = (text) => { const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const x = cv.getContext("2d"); x.font = "bold 30px IBM Plex Sans Arabic, sans-serif"; x.fillStyle = "#1b2130"; x.textAlign = "center"; x.fillText(text, 128, 42); const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthTest: false })); sp.scale.set(8, 2, 1); return sp; };
    const rebuild = () => {
      meshes.forEach((m) => scene.remove(m.group)); meshes.clear();
      for (const b of st.boxes) { const g = new T.Group(); const m = new T.Mesh(new T.BoxGeometry(b.w, b.h, b.d), mat(b.color || "#e8e1d4", st.sel === b.id)); m.castShadow = true; m.receiveShadow = true; m.position.y = b.h / 2; m.userData.id = b.id; const edges = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: 0x2a3346 })); edges.position.copy(m.position); g.add(m, edges); const lb = label(b.label || ""); lb.position.set(0, b.h + 1.6, 0); g.add(lb); g.position.set(b.x, 0, b.z); g.rotation.y = b.rot || 0; scene.add(g); meshes.set(b.id, { group: g, mesh: m }); }
      renderEdit();
    };
    const setSun = () => {
      const hour = +host.querySelector("#m-time").value; const date = host.querySelector("#m-date").value || S5.todayISO(); const lat = +host.querySelector("#m-lat").value || 35.47; const north = ((+host.querySelector("#m-north").value || 0) * Math.PI) / 180;
      const { alt, az } = S5.sunPos(lat, date, hour); const a = az + north; const R = 160;
      sun.position.set(R * Math.cos(alt) * Math.sin(a), Math.max(0.5, R * Math.sin(alt)), -R * Math.cos(alt) * Math.cos(a)); sun.intensity = alt > 0 ? 0.35 + 0.85 * Math.sin(alt) : 0.05; northArrow.rotation.y = -north;
      const hh = Math.floor(hour), mm = Math.round((hour - hh) * 60); host.querySelector("#m-time-v").textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      const shadowLen = alt > 0 ? 1 / Math.tan(alt) : Infinity;
      host.querySelector("#m-sun").innerHTML = `altitude ${S5.round((alt * 180) / Math.PI, 1)}° · azimuth ${S5.round((az * 180) / Math.PI, 1)}°<br>shadow of a 10 m mass: ${alt > 0 ? S5.round(10 * shadowLen, 1) + " m" : "sun below horizon"}`;
    };
    const renderEdit = () => {
      const box = host.querySelector("#m-edit"); const b = st.boxes.find((x) => x.id === st.sel);
      const total = st.boxes.reduce((s, x) => s + x.w * x.d, 0), gfa = st.boxes.reduce((s, x) => s + x.w * x.d * Math.max(1, Math.round(x.h / 3.2)), 0);
      box.innerHTML = b ? `<h4>Selected mass</h4><div class="form-grid" style="margin-top:6px">${[["label", "Name", "text"], ["w", "Width (m)"], ["d", "Depth (m)"], ["h", "Height (m)"], ["rot", "Rotation °"], ["color", "Colour", "color"]].map(([k, n, t]) => `<label class="field"><span>${n}</span><input data-mb="${k}" type="${t || "number"}" step="0.5" value="${k === "rot" ? S5.round(((b.rot || 0) * 180) / Math.PI, 0) : S5.esc(b[k])}" ${t === "text" ? 'dir="auto"' : ""}></label>`).join("")}</div><p class="small mono" style="margin-top:6px">${S5.round(b.w * b.d, 1)} m² footprint · ~${Math.max(1, Math.round(b.h / 3.2))} floors</p><div class="row" style="margin-top:6px"><button class="btn sm" id="m-dup">Duplicate</button><button class="btn sm danger" id="m-del">Delete</button></div>` : `<h4>Masses</h4><p class="small">${st.boxes.length} masses · footprint ${S5.round(total, 1)} m² · approx. floor area ${S5.round(gfa, 0)} m²</p><p class="tiny muted">Tap a mass to edit it.</p>`;
      box.querySelectorAll("[data-mb]").forEach((i) => i.addEventListener("input", () => { const k = i.dataset.mb; b[k] = k === "label" || k === "color" ? i.value : k === "rot" ? ((+i.value || 0) * Math.PI) / 180 : Math.max(0.5, +i.value || 0.5); const keep = st.sel; rebuild(); st.sel = keep; }));
      box.querySelector("#m-del")?.addEventListener("click", () => { st.boxes = st.boxes.filter((x) => x.id !== b.id); st.sel = null; rebuild(); });
      box.querySelector("#m-dup")?.addEventListener("click", () => { const n = { ...b, id: S5.uid("b"), x: b.x + b.w + 2 }; st.boxes.push(n); st.sel = n.id; rebuild(); });
    };
    // interaction: orbit / pan / zoom / drag masses
    const ray = new T.Raycaster(); const ptr = new T.Vector2(); const plane = new T.Plane(new T.Vector3(0, 1, 0), 0); const ptrs = new Map(); let mode = null, start = null, lastPinch = 0;
    const pick = (e) => { const r = el.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam); return ray; };
    el.addEventListener("pointerdown", (e) => { el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { mode = "pinch"; const [a, b] = [...ptrs.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); return; } const hit = pick(e).intersectObjects([...meshes.values()].map((m) => m.mesh))[0]; if (hit) { st.sel = hit.object.userData.id; const b = st.boxes.find((x) => x.id === st.sel); const p = new T.Vector3(); ray.ray.intersectPlane(plane, p); mode = "drag"; start = { dx: b.x - p.x, dz: b.z - p.z }; rebuild(); } else { mode = e.button === 2 || e.shiftKey ? "pan" : "orbit"; start = { x: e.clientX, y: e.clientY, ...orbit }; if (st.sel) { st.sel = null; rebuild(); } } });
    el.addEventListener("pointermove", (e) => { const p0 = ptrs.get(e.pointerId); if (!p0) return; p0.x = e.clientX; p0.y = e.clientY;
      if (mode === "pinch" && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); orbit.r = S5.clamp(orbit.r * (lastPinch / d), 10, 300); lastPinch = d; placeCam(); return; }
      if (mode === "drag") { const p = new T.Vector3(); pick(e).ray.intersectPlane(plane, p); const b = st.boxes.find((x) => x.id === st.sel); b.x = Math.round((p.x + start.dx) * 2) / 2; b.z = Math.round((p.z + start.dz) * 2) / 2; const m = meshes.get(b.id); m.group.position.set(b.x, 0, b.z); return; }
      if (mode === "orbit" && !top) { orbit.th = start.th + (e.clientX - start.x) * 0.008; orbit.ph = S5.clamp(start.ph - (e.clientY - start.y) * 0.006, 0.12, 1.5); placeCam(); }
      if (mode === "pan" || (mode === "orbit" && top)) { const k = orbit.r / 600; orbit.tx = start.tx - (e.clientX - start.x) * k; orbit.tz = start.tz - (e.clientY - start.y) * k; placeCam(); } });
    const up = (e) => { ptrs.delete(e.pointerId); if (!ptrs.size) mode = null; };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("wheel", (e) => { e.preventDefault(); orbit.r = S5.clamp(orbit.r * Math.exp(e.deltaY * 0.001), 10, 300); placeCam(); }, { passive: false });
    // controls
    let playing = false, raf;
    host.querySelector("#m-time").addEventListener("input", setSun); host.querySelector("#m-date").addEventListener("input", setSun); host.querySelector("#m-lat").addEventListener("input", setSun); host.querySelector("#m-north").addEventListener("input", (e) => { st.north = +e.target.value || 0; setSun(); });
    host.querySelector("#m-play").onclick = (e) => { playing = !playing; e.target.textContent = playing ? "⏸ Day" : "▶ Day"; };
    host.querySelector("#m-add").onclick = () => { const b = { id: S5.uid("b"), x: orbit.tx + 4, z: orbit.tz + 4, w: 8, d: 8, h: 3.5, rot: 0, label: "Mass " + (st.boxes.length + 1), color: "#e8e1d4" }; st.boxes.push(b); st.sel = b.id; rebuild(); };
    host.querySelector("#m-proj").onchange = (e) => (st.projectId = e.target.value);
    host.querySelector("#m-prog").onclick = () => { const pid = host.querySelector("#m-proj").value; if (!pid) return S5.ui.toast("Choose a project first"); const sp = S5.store.list("space", (s) => s.projectId === pid); if (!sp.length) return S5.ui.toast("That project has no spaces in its program yet"); let x = -20, z = -10, rowH = 0; st.boxes = []; for (const s of sp) for (let k = 0; k < (s.count || 1); k++) { const a = Math.max(4, s.area || 9); const w = Math.round(Math.sqrt(a * 1.3) * 2) / 2, d = Math.round((a / w) * 2) / 2; if (x + w > 30) { x = -20; z += rowH + 3; rowH = 0; } st.boxes.push({ id: S5.uid("b"), x: x + w / 2, z: z + d / 2, w, d, h: 3.2, rot: 0, label: s.name, color: { public: "#e8e1d4", semi: "#dfe6d4", private: "#e6d6d4", service: "#d4dbe6" }[s.privacy] || "#e8e1d4" }); x += w + 2; rowH = Math.max(rowH, d); } st.sel = null; rebuild(); S5.ui.toast(`${st.boxes.length} masses from the program — arrange them`); };
    host.querySelector("#m-save").onclick = async () => { const data = { name: host.querySelector("#m-name").value || "Massing study", projectId: host.querySelector("#m-proj").value, boxes: st.boxes, north: st.north }; if (st.id && S5.store.get(st.id)) await S5.store.update(st.id, data); else st.id = (await S5.store.create("massing", data)).id; S5.ui.toast("Massing saved"); };
    host.querySelector("#m-png").onclick = () => { renderer.render(scene, cam); renderer.domElement.toBlob((b) => S5.ui.saveFile(`massing-${S5.todayISO()}.png`, b), "image/png"); };
    host.querySelector("#m-top").onclick = () => { top = true; placeCam(); }; host.querySelector("#m-persp").onclick = () => { top = false; placeCam(); };
    const ro = new ResizeObserver(() => { renderer.setSize(W(), Hh()); cam.aspect = W() / Hh(); cam.updateProjectionMatrix(); }); ro.observe(el);
    const loop = () => { if (!el.isConnected) { renderer.dispose(); ro.disconnect(); return; } if (playing) { const t = host.querySelector("#m-time"); t.value = +t.value >= 19.5 ? 5 : +t.value + 0.03; setSun(); } renderer.render(scene, cam); raf = requestAnimationFrame(loop); };
    rebuild(); placeCam(); setSun(); loop();
    return () => cancelAnimationFrame(raf);
  },
  persp(host) {
    host.innerHTML = `<div class="split"><div><canvas id="pp" style="width:100%;height:min(62vh,520px);display:block;border-radius:10px;border:1px solid var(--rule-strong);background:#fff;touch-action:none"></canvas></div><div class="stack"><section class="sheet"><h4>Two-point perspective machine</h4><p class="small" style="margin:6px 0">Drag the red vanishing points, the horizon (blue), or the box's front edge (black). Watch how the same box changes. This is the construction you draw by hand.</p><label class="field"><span>Box width : depth</span><input type="range" id="pp-r" min="0.4" max="2.5" step="0.05" value="1.2"></label><label class="field"><span>Box height</span><input type="range" id="pp-h" min="40" max="260" value="140"></label><label class="check"><input type="checkbox" id="pp-c" checked> Show construction lines</label><label class="check"><input type="checkbox" id="pp-w" checked> Add windows (divide by diagonals)</label></section><section class="sheet"><h4>What to notice</h4><ul class="small" style="padding-inline-start:18px;display:grid;gap:4px"><li>VPs close together → strong distortion (wide-angle look).</li><li>Horizon at eye level: the box's top shows only when it is below the horizon.</li><li>Vertical edges stay vertical in two-point perspective.</li><li>Equal windows shrink toward the VP — found with diagonals, not guessed.</li></ul></section></div></div>`;
    const cv = host.querySelector("#pp"); const st = { v1: 0.08, v2: 0.92, hy: 0.42, fx: 0.48, fy: 0.62 }; let drag = null;
    const draw = () => {
      const r = cv.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); cv.width = r.width * d; cv.height = r.height * d; const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.direction = "ltr"; const W = r.width, Hh = r.height;
      const V1 = [st.v1 * W, st.hy * Hh], V2 = [st.v2 * W, st.hy * Hh]; const F0 = [st.fx * W, st.fy * Hh]; const hgt = +host.querySelector("#pp-h").value; const F1 = [F0[0], F0[1] - hgt]; const ratio = +host.querySelector("#pp-r").value; const showC = host.querySelector("#pp-c").checked;
      const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const tl = 0.32 / ratio, tr = 0.32 * ratio * 0.6; const L0 = lerp(F0, V1, Math.min(0.85, tl)), R0 = lerp(F0, V2, Math.min(0.85, tr));
      const inter = (p1, p2, p3, p4) => { const d1 = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]); const a = p1[0] * p2[1] - p1[1] * p2[0], b = p3[0] * p4[1] - p3[1] * p4[0]; return [(a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d1, (a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d1]; };
      const L1 = inter(F1, V1, L0, [L0[0], 0]), R1 = inter(F1, V2, R0, [R0[0], 0]); const B0 = inter(L0, V2, R0, V1), B1 = inter(L1, V2, R1, V1);
      x.clearRect(0, 0, W, Hh); x.strokeStyle = "#1f4fa8"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, V1[1]); x.lineTo(W, V1[1]); x.stroke(); x.fillStyle = "#1f4fa8"; x.font = "12px IBM Plex Mono"; x.fillText("horizon = eye level", 8, V1[1] - 6);
      if (showC) { x.strokeStyle = "rgba(31,79,168,.25)"; x.lineWidth = 1; for (const p of [F0, F1, L0, L1, R0, R1]) for (const v of [V1, V2]) { x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(v[0], v[1]); x.stroke(); } }
      const face = (pts, fill) => { x.beginPath(); x.moveTo(...pts[0]); pts.slice(1).forEach((p) => x.lineTo(...p)); x.closePath(); x.fillStyle = fill; x.fill(); x.strokeStyle = "#1b2130"; x.lineWidth = 2; x.stroke(); };
      face([F0, L0, L1, F1], "#efe9dc"); face([F0, R0, R1, F1], "#e3dccd"); if (F1[1] > V1[1]) face([F1, L1, B1, R1], "#f7f3ea"); else if (F0[1] < V1[1]) face([F0, L0, B0, R0], "#d9d1bf");
      if (host.querySelector("#pp-w").checked) { // windows on the right face using diagonals
        x.strokeStyle = "#1b2130"; x.lineWidth = 1.2; const n = 4; let a0 = F0, a1 = F1; const segs = [[F0, F1]];
        const mid = inter(F0, R1, F1, R0); const mv0 = inter(mid, [mid[0], 0], F0, R0); const mv1 = inter(mid, [mid[0], 0], F1, R1); segs.push([mv0, mv1]);
        if (showC) { x.strokeStyle = "rgba(184,57,42,.5)"; x.beginPath(); x.moveTo(...F0); x.lineTo(...R1); x.moveTo(...F1); x.lineTo(...R0); x.stroke(); }
        for (const [p0, p1] of [[F0, F1], [mv0, mv1]]) { const q0 = lerp(p0, p1, 0.3), q1 = lerp(p0, p1, 0.7); const nx0 = lerp(p0, V2, 0.0), _ = nx0; const e0 = inter(q0, V2, p0 === F0 ? mv0 : R0, p0 === F0 ? mv1 : R1), e1 = inter(q1, V2, p0 === F0 ? mv0 : R0, p0 === F0 ? mv1 : R1); const s0 = lerp(q0, e0, 0.2), s1 = lerp(q1, e1, 0.2), t0 = lerp(q0, e0, 0.8), t1 = lerp(q1, e1, 0.8); x.fillStyle = "#9fb4d6"; x.strokeStyle = "#1b2130"; x.beginPath(); x.moveTo(...s0); x.lineTo(...t0); x.lineTo(...t1); x.lineTo(...s1); x.closePath(); x.fill(); x.stroke(); }
      }
      for (const [p, c] of [[V1, "#b8392a"], [V2, "#b8392a"], [F0, "#1b2130"]]) { x.fillStyle = c; x.beginPath(); x.arc(p[0], p[1], 7, 0, 7); x.fill(); }
      x.fillStyle = "#b8392a"; x.fillText("VP1", V1[0] + 10, V1[1] + 18); x.fillText("VP2", V2[0] - 34, V2[1] + 18);
      st.geom = { V1, V2, F0, W, Hh };
    };
    cv.addEventListener("pointerdown", (e) => { const r = cv.getBoundingClientRect(); const p = [e.clientX - r.left, e.clientY - r.top]; const g = st.geom; const near = (q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 18; drag = near(g.V1) ? "v1" : near(g.V2) ? "v2" : near(g.F0) || Math.abs(p[0] - g.F0[0]) < 12 ? "f" : Math.abs(p[1] - g.V1[1]) < 10 ? "h" : null; if (drag) cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => { if (!drag) return; const r = cv.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; if (drag === "v1") st.v1 = S5.clamp(px, -0.2, st.fx - 0.05); if (drag === "v2") st.v2 = S5.clamp(px, st.fx + 0.05, 1.2); if (drag === "h") st.hy = S5.clamp(py, 0.05, 0.95); if (drag === "f") { st.fx = S5.clamp(px, st.v1 + 0.05, st.v2 - 0.05); st.fy = S5.clamp(py, 0.1, 0.98); } draw(); });
    cv.addEventListener("pointerup", () => (drag = null));
    host.addEventListener("input", draw); new ResizeObserver(draw).observe(cv); draw();
  },
  compose(host) {
    host.innerHTML = `<div class="split"><div class="stack"><div style="position:relative"><canvas id="cp" style="width:100%;display:block;border-radius:10px;border:1px solid var(--rule-strong);background:var(--paper-2)"></canvas></div><div class="row"><button class="btn sm primary" id="cp-load">Load a photo or drawing</button>${["thirds", "golden", "spiral", "grid", "diag"].map((k) => `<label class="check small"><input type="checkbox" data-ov="${k}" ${k === "thirds" || k === "spiral" ? "checked" : ""}> ${{ thirds: "Rule of thirds", golden: "Golden sections", spiral: "Golden spiral", grid: "Modular grid", diag: "Diagonals" }[k]}</label>`).join("")}</div></div>
      <div class="stack"><section class="sheet"><h4>Palette from the image</h4><div id="cp-pal" class="chips" style="margin-top:6px"></div></section><section class="sheet"><h4>Colour harmony</h4><div class="row"><input type="color" id="cp-base" value="#1f4fa8"><select id="cp-mode"><option value="comp">Complementary</option><option value="ana">Analogous</option><option value="tri">Triadic</option><option value="split">Split complementary</option><option value="mono">Monochrome</option></select></div><div id="cp-harm" class="chips" style="margin-top:8px"></div><p class="tiny muted" style="margin-top:6px">Tap a swatch to copy its code.</p></section>
      <section class="sheet"><h4>Proportion checks</h4><p class="small">Golden ratio φ = 1.618 · √2 rectangle (A-paper) = 1.414 · 3:4:5 triangle for right angles on site.</p></section></div></div>`;
    const cv = host.querySelector("#cp"); let img = null;
    const draw = () => {
      const r = cv.getBoundingClientRect(); const W = r.width; if (W < 4 || !cv.isConnected) return; const Hh = img ? (W * img.height) / img.width : W * 0.62; cv.style.height = Hh + "px"; const d = Math.min(devicePixelRatio || 1, 2); cv.width = W * d; cv.height = Hh * d; const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0);
      if (img) x.drawImage(img, 0, 0, W, Hh); else { x.fillStyle = "#e9e4d8"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#1f4fa8"; x.fillRect(W * 0.58, Hh * 0.2, W * 0.3, Hh * 0.6); x.fillStyle = "#b8392a"; x.beginPath(); x.arc(W * 0.3, Hh * 0.62, Hh * 0.14, 0, 7); x.fill(); x.fillStyle = "#1b2130"; x.font = "14px IBM Plex Sans"; x.fillText("Load a photo of a façade, a board or a sketch", 16, 26); }
      const on = (k) => host.querySelector(`[data-ov="${k}"]`).checked; x.lineWidth = 1.5;
      if (on("thirds")) { x.strokeStyle = "rgba(255,255,255,.9)"; x.setLineDash([6, 5]); for (const t of [1 / 3, 2 / 3]) { x.beginPath(); x.moveTo(W * t, 0); x.lineTo(W * t, Hh); x.moveTo(0, Hh * t); x.lineTo(W, Hh * t); x.stroke(); } x.setLineDash([]); }
      if (on("golden")) { x.strokeStyle = "rgba(242,201,76,.95)"; const g = 0.382; for (const t of [g, 1 - g]) { x.beginPath(); x.moveTo(W * t, 0); x.lineTo(W * t, Hh); x.moveTo(0, Hh * t); x.lineTo(W, Hh * t); x.stroke(); } }
      if (on("grid")) { x.strokeStyle = "rgba(31,79,168,.45)"; x.lineWidth = 1; for (let i = 1; i < 12; i++) { x.beginPath(); x.moveTo((W * i) / 12, 0); x.lineTo((W * i) / 12, Hh); x.stroke(); } for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(0, (Hh * i) / 8); x.lineTo(W, (Hh * i) / 8); x.stroke(); } }
      if (on("diag")) { x.strokeStyle = "rgba(184,57,42,.7)"; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, Hh); x.moveTo(W, 0); x.lineTo(0, Hh); x.stroke(); }
      if (on("spiral")) { x.strokeStyle = "rgba(242,201,76,1)"; x.lineWidth = 2; let ww = W, hh = Hh, ox = 0, oy = 0; x.beginPath(); for (let i = 0; i < 9; i++) { const dir = i % 4; if (dir === 0) { const s = Math.min(hh, ww * 0.618); x.arc(ox + s, oy + s, s, Math.PI, 1.5 * Math.PI); ox += s; ww -= s; } else if (dir === 1) { const s = Math.min(ww, hh * 0.618); x.arc(ox + ww - s, oy + s, s, 1.5 * Math.PI, 2 * Math.PI); oy += s; hh -= s; } else if (dir === 2) { const s = Math.min(hh, ww * 0.618); x.arc(ox + ww - s, oy + hh - s, s, 0, 0.5 * Math.PI); ww -= s; } else { const s = Math.min(ww, hh * 0.618); x.arc(ox + s, oy + hh - s, s, 0.5 * Math.PI, Math.PI); hh -= s; } } x.stroke(); }
      palette(x, W, Hh);
    };
    const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    const palette = (x, W, Hh) => { // k-means (k=6) on a downsampled copy
      const d = x.getImageData(0, 0, Math.floor(W), Math.floor(Hh)).data; const px = []; for (let i = 0; i < d.length; i += 4 * 37) px.push([d[i], d[i + 1], d[i + 2]]);
      let cs = px.slice(0, 6).map((p, i) => px[Math.floor((i / 6) * px.length)]); for (let it = 0; it < 8; it++) { const sums = cs.map(() => [0, 0, 0, 0]); for (const p of px) { let bi = 0, bd = 1e9; cs.forEach((c, i) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (dd < bd) { bd = dd; bi = i; } }); const s = sums[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; } cs = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3], s[3]] : cs[i])); }
      host.querySelector("#cp-pal").innerHTML = cs.sort((a, b) => (b[3] || 0) - (a[3] || 0)).map((c) => { const h = hex(c[0], c[1], c[2]); return `<button class="pill" data-copy="${h}" style="background:${h};color:${(c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) > 140 ? "#111" : "#fff"};border:0;padding:8px 12px;cursor:pointer">${h}</button>`; }).join("");
    };
    const harmony = () => {
      const b = host.querySelector("#cp-base").value; const r = parseInt(b.slice(1, 3), 16) / 255, g = parseInt(b.slice(3, 5), 16) / 255, bl = parseInt(b.slice(5, 7), 16) / 255; const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); let h = 0; const l = (mx + mn) / 2; const s = mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn); if (mx !== mn) h = mx === r ? (g - bl) / (mx - mn) + (g < bl ? 6 : 0) : mx === g ? (bl - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h *= 60;
      const hsl = (H, S, L) => `hsl(${((H % 360) + 360) % 360} ${Math.round(S * 100)}% ${Math.round(L * 100)}%)`; const m = host.querySelector("#cp-mode").value;
      const set = { comp: [0, 180], ana: [-30, 0, 30], tri: [0, 120, 240], split: [0, 150, 210], mono: [0, 0, 0] }[m]; const ls = m === "mono" ? [l * 0.55, l, Math.min(0.92, l * 1.45)] : set.map(() => l);
      host.querySelector("#cp-harm").innerHTML = set.map((o, i) => { const c = hsl(h + o, s, ls[i]); return `<button class="pill" data-copy="${c}" style="background:${c};color:#fff;border:0;padding:10px 14px;cursor:pointer">${c}</button>`; }).join("");
    };
    host.addEventListener("click", (e) => { const t = e.target.closest("[data-copy]"); if (t) navigator.clipboard?.writeText(t.dataset.copy).then(() => S5.ui.toast("Copied " + t.dataset.copy), () => {}); });
    host.querySelector("#cp-load").onclick = async () => { const [f] = await S5.ui.pickFile("image/*"); if (!f) return; const u = URL.createObjectURL(f); img = new Image(); img.onload = draw; img.src = u; };
    host.addEventListener("input", (e) => { if (e.target.dataset.ov != null) draw(); if (e.target.id === "cp-base" || e.target.id === "cp-mode") harmony(); });
    host.addEventListener("change", (e) => { if (e.target.dataset.ov != null) draw(); if (e.target.id === "cp-mode") harmony(); });
    new ResizeObserver(draw).observe(cv); draw(); harmony();
  },
};

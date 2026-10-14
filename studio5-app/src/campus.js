/* The virtual campus (الكلية الافتراضية) — the front door of Studio5. Walk across a small 3D campus and step
   into the departments: each building opens the matching part of the app (architecture, civil, the library and
   the tutor, the drawing studio, the lecture hall, student affairs). Built light on purpose for the MatePad and
   a modest laptop: no shadow maps, a few hundred triangles per building, instanced trees, capped pixel ratio, and
   the frame rate drops to ~10 fps when you stand still. Walk with the on-screen stick, WASD / arrow keys, or tap a
   building (or its square on the map) to walk there by itself. Without WebGL the same departments show as cards. */
S5.CAMPUS = [
  { id: "arch", en: "Department of Architecture", ar: "قسم هندسة العمارة", tag: "Northern Technical University", tagAr: "الجامعة التقنية الشمالية", x: -46, z: -6, w: 18, d: 30, h: 13, face: "e", wall: "#e8e0cf", trim: "#2a5fa8",
    desc: "Architecture subjects, the virtual design studio and your design projects.",
    rooms: [["Architecture subjects", { v: "study" }], ["Virtual design studio", { v: "atelier", id: "massing" }], ["Design projects", { v: "projects" }]] },
  { id: "civil", en: "Department of Civil Engineering", ar: "قسم الهندسة المدنية", tag: "University of Kirkuk", tagAr: "جامعة كركوك", x: 46, z: -6, w: 18, d: 30, h: 13, face: "w", wall: "#dfe2e6", trim: "#b5651d",
    desc: "Civil subjects, the virtual civil lab, engineering tools and the construction lab.",
    rooms: [["Civil subjects", { v: "study" }], ["Virtual civil lab", { v: "lab", id: "truss" }], ["Engineering tools", { v: "practice", tab: "tools" }], ["Construction lab", { v: "practice", tab: "lab" }]] },
  { id: "lib", en: "Central Library", ar: "المكتبة المركزية", tag: "The tutor is inside", tagAr: "المعلّم بالداخل", x: 0, z: -52, w: 36, d: 16, h: 11, face: "s", wall: "#efe9dc", trim: "#6d4c2f", columns: true,
    desc: "The tutor with its 409-lesson library, your notebooks, skills and memory.",
    rooms: [["The Tutor", { v: "tutor" }], ["Library & skills", { v: "library" }]] },
  { id: "studio", en: "The Studio", ar: "المرسم", tag: "Chalkboard, paper and a teacher", tagAr: "سبّورة وورقة ومعلّم", x: -42, z: 34, w: 16, d: 14, h: 7, face: "e", wall: "#d9cbb3", trim: "#2f4a35", skylight: true,
    desc: "The drawing room: the teacher demonstrates on the board and checks your drawing.",
    rooms: [["Enter the Studio", { v: "studio" }], ["Drawing Coach", { v: "practice" }]] },
  { id: "hall", en: "Lecture Hall", ar: "قاعة المحاضرات", tag: "Timetable and review", tagAr: "الجدول والمراجعة", x: 42, z: 34, w: 16, d: 16, h: 8, face: "w", wall: "#e4dccb", trim: "#7a2e3a",
    desc: "Your timetable, the review queue and your grades.",
    rooms: [["Timetable", { v: "study", tab: "timetable" }], ["Review queue", { v: "study", tab: "review" }], ["Grades", { v: "study", tab: "grades" }]] },
  { id: "affairs", en: "Student Affairs", ar: "شؤون الطلبة", tag: "Today and settings", tagAr: "اليوم والإعدادات", x: 26, z: 62, w: 12, d: 10, h: 6, face: "w", wall: "#e9e6de", trim: "#1f3a68",
    desc: "Today's plan, deadlines, backup and settings.",
    rooms: [["Today", { v: "today" }], ["System & backup", { v: "system" }]] },
];
/* college modules (src/college/*.js, loaded before this file) add rooms with S5.CAMPUS_EXTRA.push([buildingId, [title, route]]) */
(S5.CAMPUS_EXTRA || []).forEach(([id, room]) => { const b = S5.CAMPUS.find((x) => x.id === id); if (b && !b.rooms.some((r) => r[0] === room[0])) b.rooms.push(room); });
S5.CAMPUS.forEach((b) => { // the door sits in the middle of the facing wall; the zone in front of it opens the card
  const n = { e: [1, 0], w: [-1, 0], s: [0, 1], n: [0, -1] }[b.face]; b.n = n;
  b.door = [b.x + n[0] * (b.w / 2), b.z + n[1] * (b.d / 2)]; b.spot = [b.door[0] + n[0] * 10, b.door[1] + n[1] * 10];
});
S5.campusState = (() => { try { return JSON.parse(localStorage.getItem("s5-campus") || "null"); } catch { return null; } })() || { x: 0, z: 100, yaw: 0 };
S5.campusSave = () => { try { localStorage.setItem("s5-campus", JSON.stringify(S5.campusState)); } catch {} };

S5.views.campus = () => {
  S5.ui.mount(() => S5.campusRun(document.getElementById("campus")));
  return `<div class="campus" id="campus">
    <div class="cp-3d" id="cp-3d"></div>
    <div class="cp-head"><span class="eyebrow">Studio5</span><h1>Virtual campus</h1><p class="tiny">Walk with the stick or WASD / arrows · drag to look · tap a building to walk there</p></div>
    <canvas class="cp-map" id="cp-map" width="180" height="180" aria-label="Campus map"></canvas>
    <div class="cp-joy" id="cp-joy" aria-hidden="true"><div class="cp-knob"></div></div>
    <div class="cp-card" id="cp-card" hidden></div>
    <div class="cp-fade" id="cp-fade"></div>
  </div>`;
};
S5.campusCard = (b) => `<div class="cp-card-in"><span class="eyebrow">${S5.esc(b.tag)}</span><h2>${S5.esc(b.en)}</h2><p class="small">${S5.esc(b.desc)}</p>
  <div class="cp-rooms">${b.rooms.map(([t], i) => `<button class="btn ${i ? "" : "primary"}" data-act="campus-room" data-b="${b.id}" data-i="${i}">${S5.esc(t)}</button>`).join("")}</div></div>`;
S5.act["campus-room"] = (el) => {
  const b = S5.CAMPUS.find((x) => x.id === el.dataset.b); const room = b && b.rooms[+el.dataset.i]; if (!room) return;
  const f = document.getElementById("cp-fade"); if (f) f.classList.add("on");
  setTimeout(() => S5.ui.go({ ...room[1] }), f ? 260 : 0);
};
/* without WebGL: the same departments as cards */
S5.campusFallback = (host) => {
  host.classList.add("flat");
  host.innerHTML = `<div class="page-head"><div class="titles"><span class="eyebrow">Studio5</span><h1>Virtual campus</h1><p class="small muted">3D is not available on this device — here are the departments.</p></div></div>
    <div class="grid cols-3">${S5.CAMPUS.map((b) => `<section class="sheet" style="border-inline-start:4px solid ${b.trim}">${S5.campusCard(b)}</section>`).join("")}</div>`;
};

S5.campusRun = (host) => {
  if (!host) return;
  const T = window.THREE; let probe = null;
  try { probe = document.createElement("canvas").getContext("webgl"); } catch {}
  if (!T || !probe) { S5.campusFallback(host); return; }
  const el = host.querySelector("#cp-3d"), mapC = host.querySelector("#cp-map"), card = host.querySelector("#cp-card"), joy = host.querySelector("#cp-joy"), knob = joy.firstElementChild;
  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: devicePixelRatio < 2, powerPreference: "low-power" }); } catch { S5.campusFallback(host); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(el.clientWidth, el.clientHeight); el.appendChild(renderer.domElement);
  // Baghdad local time decides day or night (UTC+3, no daylight saving)
  const hr = S5.campusHour ?? (new Date().getUTCHours() + 3) % 24, night = hr < 6 || hr >= 19, dusk = hr === 18 || hr === 6;
  const sky = night ? 0x0f1a2e : dusk ? 0xe9b98f : 0xbcd8ef;
  const scene = new T.Scene(); scene.background = new T.Color(sky); scene.fog = new T.Fog(sky, 70, 190);
  const cam = new T.PerspectiveCamera(62, el.clientWidth / el.clientHeight, 0.3, 400);
  scene.add(new T.HemisphereLight(night ? 0x5a70a0 : 0xffffff, night ? 0x1f2a1c : 0x8a9a6a, night ? 0.75 : 0.62));
  const sun = new T.DirectionalLight(night ? 0x8fa6d8 : 0xfff2dc, night ? 0.25 : 0.55); sun.position.set(-40, 80, 30); scene.add(sun);
  const disposables = [];
  const mat = (o) => { const m = new T.MeshLambertMaterial(o); disposables.push(m); return m; };
  const geo = (g) => (disposables.push(g), g);
  const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); disposables.push(t); return t; };
  const add = (g, m, x, y, z) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); scene.add(o); return o; };

  /* ground, paths, plaza */
  add(geo(new T.PlaneGeometry(400, 400)), mat({ color: night ? 0x2c4428 : 0x5f8a45 }), 0, 0, 0).rotation.x = -Math.PI / 2;
  const stone = mat({ color: night ? 0x56575a : 0xbdb5a4 });
  const path = (x0, z0, x1, z1, wd = 6) => { const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz); const p = add(geo(new T.PlaneGeometry(wd, L)), stone, (x0 + x1) / 2, 0.02, (z0 + z1) / 2); p.rotation.x = -Math.PI / 2; p.rotation.z = -Math.atan2(dx, dz); };
  path(0, 110, 0, 0, 7); path(0, 0, 0, -44, 7); path(-37, -6, 37, -6, 6);
  for (const b of S5.CAMPUS) if (["studio", "hall", "affairs"].includes(b.id)) path(b.spot[0], b.spot[1], b.id === "affairs" ? 0 : Math.sign(b.x) * 3, b.spot[1], 5);
  path(-14, 34, 14, 34, 5);
  add(geo(new T.CircleGeometry(15, 40)), stone, 0, 0.03, 0).rotation.x = -Math.PI / 2;
  // fountain
  add(geo(new T.CylinderGeometry(5.2, 5.6, 0.9, 32)), mat({ color: 0xcfc7b6 }), 0, 0.45, 0);
  const water = add(geo(new T.CylinderGeometry(4.7, 4.7, 0.1, 32)), mat({ color: 0x4f9fd0, emissive: 0x0e3550 }), 0, 0.88, 0);
  add(geo(new T.CylinderGeometry(0.5, 0.7, 2.6, 12)), mat({ color: 0xe6dfd0 }), 0, 1.6, 0);
  const jet = add(geo(new T.SphereGeometry(0.9, 12, 8)), mat({ color: 0xbfe6ff, emissive: 0x3a7ca8, transparent: true, opacity: 0.7 }), 0, 3.2, 0);

  /* buildings: window texture by day, lit windows at night (emissive), name sign over the door, floating label */
  const winTex = (wall, lit) => canvasTex(128, 128, (g, w, h) => { g.fillStyle = lit ? "#000" : wall; g.fillRect(0, 0, w, h); g.fillStyle = lit ? "#ffd9a0" : "#40566e"; g.fillRect(26, 30, 76, 62); if (!lit) { g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(26, 30, 76, 10); g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, 118, w, 10); } });
  const signTex = (b) => canvasTex(1024, 256, (g, w, h) => { g.fillStyle = b.trim; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.textAlign = "center"; g.direction = "rtl"; g.font = "600 92px 'IBM Plex Sans Arabic', 'Segoe UI', sans-serif"; g.fillText(b.ar, w / 2, 112); g.direction = "ltr"; g.font = "500 50px 'IBM Plex Sans', 'Segoe UI', sans-serif"; g.globalAlpha = 0.85; g.fillText(b.en, w / 2, 200); });
  const pickables = [];
  for (const b of S5.CAMPUS) {
    const day = winTex(b.wall, false), lit = winTex(b.wall, true);
    const face = (len) => { const t = day.clone(), e = lit.clone(); for (const x of [t, e]) { x.wrapS = x.wrapT = T.RepeatWrapping; x.repeat.set(Math.max(1, Math.round(len / 3.6)), Math.max(1, Math.round(b.h / 3.4))); x.needsUpdate = true; disposables.push(x); } return mat({ map: t, emissive: 0xffffff, emissiveMap: e, emissiveIntensity: night ? 0.9 : 0 }); };
    const roof = mat({ color: night ? 0x3b3e44 : 0x9b9a95 }), fx = face(b.d), fz = face(b.w);
    const box = add(geo(new T.BoxGeometry(b.w, b.h, b.d)), [fx, fx, roof, roof, fz, fz], b.x, b.h / 2, b.z); box.userData.b = b; pickables.push(box);
    const trim = mat({ color: b.trim });
    add(geo(new T.BoxGeometry(b.w + 0.8, 0.7, b.d + 0.8)), trim, b.x, b.h + 0.35, b.z); // parapet
    add(geo(new T.PlaneGeometry(b.w + 6, b.d + 6)), mat({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }), b.x, 0.04, b.z).rotation.x = -Math.PI / 2; // soft contact shadow
    if (b.skylight) for (let k = -1; k <= 1; k++) { const s = add(geo(new T.BoxGeometry(b.w * 0.8, 1.4, 2)), mat({ color: 0xbfe0f7, emissive: night ? 0x806030 : 0x203040 }), b.x, b.h + 0.9, b.z + k * 4); s.rotation.x = 0.35; }
    // door, canopy and sign on the facing wall
    const [nx, nz] = b.n, ry = Math.atan2(nx, nz), dx = b.door[0], dz = b.door[1], sc = Math.min(1, (b.h - 4.4) / 2.6), sy = Math.min(6.3, b.h - 0.3 - 1.125 * sc);
    const door = add(geo(new T.PlaneGeometry(4.2, 3.2)), mat({ color: 0x2a3440, emissive: night ? 0x5a4a32 : 0x000000 }), dx + nx * 0.06, 1.6, dz + nz * 0.06); door.rotation.y = ry;
    const can = add(geo(new T.BoxGeometry(6, 0.3, 1.4)), trim, dx + nx * 0.7, Math.min(3.9, sy - 1.125 * sc - 0.4), dz + nz * 0.7); can.rotation.y = ry;
    const sign = add(geo(new T.PlaneGeometry(9, 2.25)), new T.MeshBasicMaterial({ map: signTex(b) }), dx + nx * 0.08, sy, dz + nz * 0.08); sign.rotation.y = ry; sign.scale.setScalar(sc); disposables.push(sign.material);
    if (b.columns) for (let k = 0; k < 8; k++) { const cx = b.x - 14 + k * 4; if (Math.abs(cx - dx) < 3) continue; add(geo(new T.CylinderGeometry(0.45, 0.5, b.h - 1, 10)), mat({ color: 0xf3eee3 }), cx, (b.h - 1) / 2, dz + 3); }
    if (b.columns) add(geo(new T.BoxGeometry(b.w, 1, 4.2)), trim, b.x, b.h - 0.5, dz + 2.4);
    // glowing ring on the ground in front of the door
    const ring = add(geo(new T.RingGeometry(2.2, 2.7, 32)), new T.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.8, depthWrite: false }), b.spot[0], 0.06, b.spot[1]); ring.rotation.x = -Math.PI / 2; disposables.push(ring.material); b.ring = ring;
    // floating bilingual label, readable from across the campus
    const lab = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(512, 160, (g, w, h) => { g.fillStyle = "rgba(20,28,40,.78)"; g.beginPath(); g.roundRect ? g.roundRect(4, 4, w - 8, h - 8, 28) : g.rect(4, 4, w - 8, h - 8); g.fill(); g.fillStyle = "#fff"; g.textAlign = "center"; g.direction = "rtl"; g.font = "600 54px 'IBM Plex Sans Arabic', 'Segoe UI', sans-serif"; g.fillText(b.ar, w / 2, 74); g.direction = "ltr"; g.font = "500 30px 'IBM Plex Sans', sans-serif"; g.fillStyle = "#cfd8e6"; g.fillText(b.en, w / 2, 124); }), depthTest: false, transparent: true }));
    lab.scale.set(12, 3.75, 1); lab.position.set(b.x, Math.max(b.h + 4.2, 13), b.z); lab.renderOrder = 5; scene.add(lab); disposables.push(lab.material);
  }
  /* gate with the campus name */
  const gateM = mat({ color: 0x1f3a68 });
  add(geo(new T.BoxGeometry(1.6, 7, 1.6)), gateM, -6, 3.5, 86); add(geo(new T.BoxGeometry(1.6, 7, 1.6)), gateM, 6, 3.5, 86);
  add(geo(new T.BoxGeometry(14.5, 1.4, 1.8)), gateM, 0, 7.4, 86);
  const gateSign = new T.MeshBasicMaterial({ map: canvasTex(1024, 112, (g, w, h) => { g.fillStyle = "#1f3a68"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "600 64px 'IBM Plex Sans Arabic', 'Segoe UI', sans-serif"; g.direction = "rtl"; g.fillText("الكلية الافتراضية · Studio5", w / 2, 78); }) }); disposables.push(gateSign);
  add(geo(new T.PlaneGeometry(11, 1.2)), gateSign, 0, 7.4, 86.95); add(geo(new T.PlaneGeometry(11, 1.2)), gateSign, 0, 7.4, 85.05).rotation.y = Math.PI;
  /* trees (two instanced meshes) and lamp posts */
  const spots = []; let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const blocked = (x, z) => Math.abs(x) < 6 || (Math.abs(z + 6) < 5 && Math.abs(x) < 40) || Math.hypot(x, z) < 18 || S5.CAMPUS.some((b) => Math.abs(x - b.x) < b.w / 2 + 6 && Math.abs(z - b.z) < b.d / 2 + 6) || Math.abs(z - 34) < 4 && Math.abs(x) < 34 || (z > 56 && z < 70 && x > 2 && x < 34);
  for (let i = 0; spots.length < 70 && i < 900; i++) { const x = (rnd() - 0.5) * 170, z = (rnd() - 0.5) * 170 + 6; if (!blocked(x, z)) spots.push([x, z, 0.8 + rnd() * 0.6]); }
  const trunks = new T.InstancedMesh(geo(new T.CylinderGeometry(0.25, 0.35, 2.4, 6)), mat({ color: 0x6b4a2e }), spots.length);
  const crowns = new T.InstancedMesh(geo(new T.IcosahedronGeometry(2, 0)), mat({ color: night ? 0x1f3d22 : 0x4f7d3a, flatShading: true }), spots.length);
  const M = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3();
  spots.forEach(([x, z, s], i) => { M.compose(V.set(x, 1.2 * s, z), Q, new T.Vector3(s, s, s)); trunks.setMatrixAt(i, M); M.compose(V.set(x, 3.4 * s, z), Q, new T.Vector3(s * 1.1, s * 1.3, s * 1.1)); crowns.setMatrixAt(i, M); });
  scene.add(trunks); scene.add(crowns);
  const lampM = mat({ color: 0x30353d }), bulbM = mat({ color: 0xfff1c9, emissive: night ? 0xffd27a : 0x333333 });
  for (const [x, z] of [[-5, 70], [5, 54], [-5, 38], [5, 22], [-18, -10], [18, -2], [-5, -30], [5, -30], [-30, -2], [30, -10]]) { add(geo(new T.CylinderGeometry(0.12, 0.15, 4.5, 6)), lampM, x, 2.25, z); add(geo(new T.SphereGeometry(0.4, 8, 6)), bulbM, x, 4.7, z); }
  // benches around the plaza
  const benchM = mat({ color: 0x7a5a3a });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5, bn = add(geo(new T.BoxGeometry(3, 0.5, 0.9)), benchM, Math.cos(a) * 11, 0.5, Math.sin(a) * 11); bn.rotation.y = -a + Math.PI / 2; }

  /* walking: first-person camera, collision with buildings, fountain and the campus edge */
  const st = S5.campusState; let pitch = -0.04, keys = {}, jx = 0, jz = 0, auto = null, last = performance.now(), lastMove = 0, near = null, dirty = true, alive = true;
  const EYE = 1.65, R = 0.6;
  const collide = (x, z) => {
    x = S5.clamp(x, -82, 82); z = S5.clamp(z, -78, 106);
    for (const b of S5.CAMPUS) { const hx = b.w / 2 + R, hz = b.d / 2 + R, ox = x - b.x, oz = z - b.z; if (Math.abs(ox) < hx && Math.abs(oz) < hz) { if (hx - Math.abs(ox) < hz - Math.abs(oz)) x = b.x + Math.sign(ox || 1) * hx; else z = b.z + Math.sign(oz || 1) * hz; } }
    const r = Math.hypot(x, z); if (r < 5.6 + R) { const k = (5.6 + R) / (r || 1); x *= k; z *= k; }
    for (const p of [-6, 6]) { const ox = x - p, oz = z - 86; if (Math.abs(ox) < 0.8 + R && Math.abs(oz) < 0.8 + R) x = p + Math.sign(ox || 1) * (0.8 + R); }
    return [x, z];
  };
  [st.x, st.z] = collide(st.x, st.z);
  const walkTo = (b) => { auto = { b, x: b.spot[0], z: b.spot[1], t0: performance.now() }; };
  const showCard = (b) => {
    if (near === b) return; near = b;
    if (!b) { card.hidden = true; card.innerHTML = ""; return; }
    card.innerHTML = S5.campusCard(b); card.style.setProperty("--trim", b.trim); card.hidden = false; S5.i18n.apply && S5.i18n.apply(card);
  };
  const step = (dt) => {
    let fx = 0, fz = 0; // forward / right input
    if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1;
    if (keys.KeyD) fx += 1; if (keys.KeyA) fx -= 1;
    if (keys.ArrowLeft) st.yaw += 1.8 * dt; if (keys.ArrowRight) st.yaw -= 1.8 * dt;
    fx += jx; fz += jz;
    const speed = keys.ShiftLeft || keys.ShiftRight ? 11 : 6.5;
    let mx = 0, mz = 0;
    if (fx || fz) { auto = null; const s = Math.sin(st.yaw), c = Math.cos(st.yaw); mx = (-s * fz + c * fx) * speed * dt; mz = (-c * fz - s * fx) * speed * dt; }
    else if (auto) {
      const dx = auto.x - st.x, dz = auto.z - st.z, L = Math.hypot(dx, dz);
      if (L < 0.6 || performance.now() - auto.t0 > 25000) { if (L >= 0.6) { st.x = auto.x; st.z = auto.z; } const b = auto.b; auto = null; st.yaw = Math.atan2(b.n[0], b.n[1]); pitch = 0.1; }
      else { const want = Math.atan2(-dx, -dz); let d = want - st.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); st.yaw += d * Math.min(1, dt * 5); const v = Math.min(9, L * 2.5) * dt; mx = (dx / L) * v; mz = (dz / L) * v; }
    }
    if (mx || mz) { [st.x, st.z] = collide(st.x + mx, st.z + mz); lastMove = performance.now(); dirty = true; }
    const hit = S5.CAMPUS.find((b) => Math.hypot(st.x - b.spot[0], st.z - b.spot[1]) < 6);
    showCard(auto ? null : hit || null);
  };
  const place = () => { cam.position.set(st.x, EYE, st.z); cam.rotation.order = "YXZ"; cam.rotation.set(pitch, st.yaw, 0); };
  /* the map: tap a building to walk there */
  const mg = mapC.getContext("2d"), MS = 180 / 180; // 180 px for 180 m
  const toMap = (x, z) => [90 + x * MS, 90 + (z - 12) * MS];
  const drawMap = () => {
    mg.clearRect(0, 0, 180, 180); mg.fillStyle = "rgba(30,48,30,.72)"; mg.fillRect(0, 0, 180, 180);
    mg.fillStyle = "rgba(230,224,210,.6)"; const [ax, az] = toMap(-3.5, -44); mg.fillRect(ax, az, 7, 150); const [bx, bz] = toMap(-37, -9); mg.fillRect(bx, bz, 74, 6);
    mg.beginPath(); mg.arc(...toMap(0, 0), 15, 0, 7); mg.fill();
    for (const b of S5.CAMPUS) { const [x, z] = toMap(b.x - b.w / 2, b.z - b.d / 2); mg.fillStyle = near === b || auto?.b === b ? "#ffd36b" : b.trim; mg.fillRect(x, z, b.w * MS, b.d * MS); }
    const [px, pz] = toMap(st.x, st.z); mg.save(); mg.translate(px, pz); mg.rotate(-st.yaw); mg.fillStyle = "#fff"; mg.beginPath(); mg.moveTo(0, -7); mg.lineTo(5, 5); mg.lineTo(0, 2); mg.lineTo(-5, 5); mg.closePath(); mg.fill(); mg.restore();
  };
  const onMap = (e) => { const r = mapC.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 180, y = ((e.clientY - r.top) / r.height) * 180; const b = S5.CAMPUS.find((b) => { const [x0, z0] = toMap(b.x - b.w / 2, b.z - b.d / 2); return x >= x0 - 4 && x <= x0 + b.w * MS + 4 && y >= z0 - 4 && y <= z0 + b.d * MS + 4; }); if (b) walkTo(b); };
  mapC.addEventListener("click", onMap);
  /* look: drag on the scene; a short tap on a building walks to it */
  const ray = new T.Raycaster(), ndc = new T.Vector2(); let drag = null;
  const cv = renderer.domElement; cv.style.touchAction = "none";
  cv.addEventListener("pointerdown", (e) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => { if (!drag || drag.id !== e.pointerId) return; st.yaw += (e.clientX - drag.x) * 0.005; pitch = S5.clamp(pitch + (e.clientY - drag.y) * 0.004, -0.9, 0.7); drag.x = e.clientX; drag.y = e.clientY; dirty = true; lastMove = performance.now(); });
  const up = (e) => {
    if (!drag || drag.id !== e.pointerId) return; const tap = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8 && performance.now() - drag.t < 400; drag = null;
    if (!tap) return; const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(pickables)[0]; if (h) walkTo(h.object.userData.b);
  };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", () => (drag = null));
  /* the stick (touch, pen or mouse) */
  let jid = null;
  const jset = (e) => { const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R0 = r.width / 2; let dx = (e.clientX - cx) / R0, dy = (e.clientY - cy) / R0; const L = Math.hypot(dx, dy); if (L > 1) { dx /= L; dy /= L; } jx = Math.abs(dx) > 0.12 ? dx : 0; jz = Math.abs(dy) > 0.12 ? -dy : 0; knob.style.transform = `translate(${dx * R0 * 0.6}px,${dy * R0 * 0.6}px)`; };
  joy.addEventListener("pointerdown", (e) => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); jset(e); e.preventDefault(); });
  joy.addEventListener("pointermove", (e) => { if (e.pointerId === jid) jset(e); });
  const jend = (e) => { if (e.pointerId !== jid) return; jid = null; jx = jz = 0; knob.style.transform = ""; };
  joy.addEventListener("pointerup", jend); joy.addEventListener("pointercancel", jend);
  const kd = (e) => {
    if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
    if (/^(Key[WASD]|Arrow|Shift)/.test(e.code)) { keys[e.code] = true; if (e.code.startsWith("Arrow")) e.preventDefault(); }
    if ((e.key === "Enter" || e.code === "KeyE") && near) { const btn = card.querySelector('[data-act="campus-room"]'); if (btn) btn.click(); }
  };
  const ku = (e) => { keys[e.code] = false; };
  const blur = () => { keys = {}; };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); window.addEventListener("blur", blur);
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); dirty = true; };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null; ro ? ro.observe(el) : window.addEventListener("resize", resize);
  /* frame loop: full speed while moving, ~10 fps when standing still (the rings and fountain keep breathing) */
  let lastIdle = 0, saveAt = 0;
  const frame = (now) => {
    if (!alive) return; requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt);
    const moving = dirty || auto || jx || jz || Object.values(keys).some(Boolean) || now - lastMove < 300;
    if (!moving && now - lastIdle < 100) return; lastIdle = now; dirty = false;
    const k = 0.5 + 0.5 * Math.sin(now / 400); for (const b of S5.CAMPUS) { b.ring.material.opacity = b === near ? 0.95 : 0.45 + 0.4 * k; b.ring.scale.setScalar(1 + 0.06 * k); }
    jet.scale.set(1, 1 + 0.25 * Math.sin(now / 250), 1); water.material.emissive.setHex(k > 0.5 ? 0x124060 : 0x0e3550);
    place(); renderer.render(scene, cam); drawMap();
    if (now > saveAt) { saveAt = now + 2000; S5.campusSave(); }
  };
  requestAnimationFrame(frame);
  S5.campus = { walkTo: (id) => walkTo(S5.CAMPUS.find((b) => b.id === id)), state: st, get near() { return near && near.id; } };
  return () => {
    alive = false; S5.campusSave(); S5.campus = null;
    window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("blur", blur); ro ? ro.disconnect() : window.removeEventListener("resize", resize);
    for (const d of disposables) try { d.dispose(); } catch {}
    trunks.dispose && trunks.dispose(); crowns.dispose && crowns.dispose();
    renderer.dispose(); try { renderer.forceContextLoss(); } catch {}
  };
};

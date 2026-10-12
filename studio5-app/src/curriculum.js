/* Five-year curriculum (Architecture & Building Technologies, Northern Technical University catalogue)
   Subjects are data, never hard-coded into Core logic. Each subject carries a profile that switches
   capability packs on (problems, projects, drawing, materials, etc.). Years are implemented in full and
   activated per academic year; later years stay implemented-but-disabled until you switch them on. */
S5.PROFILES = {
  studio:      { label: "Design studio", packs: ["projects", "feedback", "drawing", "references", "lectures", "assessments"] },
  drawing:     { label: "Drawing", packs: ["drawing", "lectures", "assessments", "feedback"] },
  math:        { label: "Mathematics", packs: ["problems", "formulas", "lectures", "assessments", "exams"] },
  theory:      { label: "Theory & history", packs: ["lectures", "assessments", "exams", "sources", "cases"] },
  general:     { label: "General", packs: ["lectures", "assessments", "exams"] },
  practical:   { label: "Workshop / practical", packs: ["materials", "safety", "lectures", "assessments", "physical"] },
  materials:   { label: "Building materials", packs: ["materials", "lectures", "assessments", "exams"] },
  computing:   { label: "Computing", packs: ["skills", "lectures", "assessments", "files"] },
  structures:  { label: "Structures & mechanics", packs: ["problems", "formulas", "structures", "lectures", "assessments", "exams"] },
  construction:{ label: "Building construction", packs: ["details", "materials", "drawing", "lectures", "assessments", "site"] },
  planning:    { label: "Planning", packs: ["projects", "site", "lectures", "assessments"] },
  services:    { label: "Building services", packs: ["problems", "services", "lectures", "assessments", "exams"] },
  survey:      { label: "Surveying & roads", packs: ["problems", "survey", "site", "lectures", "assessments"] },
  quantity:    { label: "Quantity & specs", packs: ["quantity", "problems", "lectures", "assessments"] },
  climate:     { label: "Climate & sustainability", packs: ["climate", "lectures", "assessments", "sources"] },
  research:    { label: "Research & graduation", packs: ["research", "projects", "sources", "feedback", "assessments"] },
  management:  { label: "Management & economics", packs: ["economics", "problems", "lectures", "assessments"] },
  rendering:   { label: "Digital representation", packs: ["drawing", "skills", "files", "assessments", "feedback"] },
};
S5.CURRICULUM = [
  // year, semester, Arabic name, English name, ECTS, profile
  [1, 1, "الرسم والتصميم المعماري", "Architectural Drawing & Design", 9, "studio"],
  [1, 1, "الرسم الحر 2D/3D", "Freehand Drawing 2D/3D", 6, "drawing"],
  [1, 1, "مبادئ التفاضل والتكامل", "Principles of Calculus", 6, "math"],
  [1, 1, "مبادئ الفن والعمارة", "Principles of Art & Architecture", 5, "theory"],
  [1, 1, "الديمقراطية وحقوق الإنسان", "Democracy & Human Rights", 2, "general"],
  [1, 1, "اللغة الإنكليزية", "English Language", 2, "general"],
  [1, 2, "مبادئ التصميم المعماري", "Principles of Architectural Design", 8, "studio"],
  [1, 2, "الرسم الهندسي", "Engineering Drawing", 5, "drawing"],
  [1, 2, "الورش", "Workshops", 4, "practical"],
  [1, 2, "مواد البناء", "Building Materials", 3, "materials"],
  [1, 2, "أساسيات الحاسوب", "Computer Fundamentals", 3, "computing"],
  [1, 2, "اللغة العربية", "Arabic Language", 2, "general"],
  [2, 3, "التصميم المعماري", "Architectural Design I", 9, "studio"],
  [2, 3, "المعادلات التفاضلية", "Differential Equations", 5, "math"],
  [2, 3, "ميكانيك ومقاومة مواد", "Mechanics & Strength of Materials", 6, "structures"],
  [2, 3, "تركيب وإنشاء المباني", "Building Construction", 6, "construction"],
  [2, 3, "جرائم البعث", "Crimes of the Baath Regime", 2, "general"],
  [2, 3, "تاريخ العمارة في العالم", "World Architecture History", 2, "theory"],
  [2, 4, "الإظهار المعماري بالحاسبة", "Computer Architectural Rendering", 6, "rendering"],
  [2, 4, "تطبيقات الحاسوب", "Computer Applications", 3, "computing"],
  [2, 4, "التصميم المعماري", "Architectural Design II", 9, "studio"],
  [2, 4, "الإحصاء", "Statistics", 5, "math"],
  [2, 4, "المنطق ومنهجية التصميم", "Logic & Design Methodology", 3, "theory"],
  [2, 4, "اللغة الإنكليزية", "English Language II", 2, "general"],
  [2, 4, "اللغة العربية", "Arabic Language II", 2, "general"],
  [3, 5, "التصميم المعماري المتقدم", "Advanced Architectural Design", 9, "studio"],
  [3, 5, "التصميم الإنشائي", "Structural Design", 6, "structures"],
  [3, 5, "تركيب المباني: السلالم والأرضيات", "Building Construction: Stairs & Floors", 6, "construction"],
  [3, 5, "أساسيات التخطيط", "Fundamentals of Planning", 6, "planning"],
  [3, 5, "الخدمات الصحية", "Sanitary Services", 3, "services"],
  [3, 6, "التصميم المعماري", "Architectural Design III", 9, "studio"],
  [3, 6, "المسح الهندسي", "Engineering Surveying", 6, "survey"],
  [3, 6, "تصميم الطرق", "Road Design", 6, "survey"],
  [3, 6, "خدمات الإنارة والصوتيات المعمارية", "Lighting & Architectural Acoustics", 6, "services"],
  [3, 6, "الخدمات الكهربائية", "Electrical Services", 3, "services"],
  [4, 7, "التصميم المعماري", "Architectural Design IV", 9, "studio"],
  [4, 7, "تصميم الفضاءات الداخلية", "Interior Space Design", 6, "studio"],
  [4, 7, "تقنيات البناء المتقدمة", "Advanced Building Technologies", 6, "construction"],
  [4, 7, "المسح الكمي والمواصفات", "Quantity Surveying & Specifications", 3, "quantity"],
  [4, 7, "التخطيط الإسكاني", "Housing Planning", 6, "planning"],
  [4, 8, "التصميم المعماري", "Architectural Design V", 9, "studio"],
  [4, 8, "تصميم الفضاءات الخارجية", "Exterior Space Design", 6, "studio"],
  [4, 8, "الإنشاء التقني", "Technical Construction", 6, "construction"],
  [4, 8, "العمارة والمناخ", "Architecture & Climate", 3, "climate"],
  [4, 8, "نظريات العمارة", "Theories of Architecture", 6, "theory"],
  [5, 9, "التصميم المعماري", "Architectural Design VI", 9, "studio"],
  [5, 9, "إدارة المشاريع والاقتصاد الهندسي", "Project Management & Engineering Economics", 6, "management"],
  [5, 9, "منهجية البحث العلمي", "Research Methodology", 3, "research"],
  [5, 9, "العمارة المستدامة", "Sustainable Architecture", 6, "climate"],
  [5, 9, "مشروع التخرج الأولي", "Preliminary Graduation Project", 6, "research"],
  [5, 10, "نظريات التصميم المعماري", "Theories of Architectural Design", 6, "theory"],
  [5, 10, "العمارة العربية والعراقية", "Arab & Iraqi Architecture", 6, "theory"],
  [5, 10, "فلسفة العمارة", "Philosophy of Architecture", 6, "theory"],
  [5, 10, "نظريات النقد المعماري", "Theories of Architectural Criticism", 3, "theory"],
  [5, 10, "مشروع التخرج النهائي", "Final Graduation Project", 9, "research"],
];
S5.YEARS = [
  { n: 1, name: "Architecture Foundation", ar: "التأسيس المعماري", focus: "Drawing, design principles, art, engineering drawing, workshops, materials, calculus", tools: ["drawingCoach", "materialCards", "problemNotebook", "projectLite"] },
  { n: 2, name: "Design, Construction & Representation", ar: "التصميم والإنشاء والإظهار", focus: "Design studio, mechanics, construction, history, digital rendering, statistics", tools: ["beam", "section", "stats", "constructionDetails", "renderLog"] },
  { n: 3, name: "Structures, Planning, Surveying & Services", ar: "الإنشاء والتخطيط والموقع والخدمات", focus: "Structural design, stairs & floors, planning, sanitary, surveying, roads, lighting, acoustics, electrical", tools: ["stairs", "levelling", "curve", "lux", "reverb", "water"] },
  { n: 4, name: "Interior, Exterior, Quantities, Climate & Theory", ar: "الداخل والخارج والكميات والمناخ والنظرية", focus: "Interior & exterior design, advanced technologies, quantity surveying, housing, climate, theory", tools: ["boq", "sun", "uvalue", "housing"] },
  { n: 5, name: "Research, Delivery & Graduation", ar: "البحث والإدارة والتخرج", focus: "Graduation project, research methodology, project management & economics, sustainability, criticism", tools: ["research", "gantt", "npv", "lcc"] },
];
// Calculator tools, available when their year is active (or turned on by flag)
S5.TOOLS = {
  drawingCoach: { y: 1, name: "Drawing Coach", where: "practice" },
  materialCards: { y: 1, name: "Material cards", where: "practice" },
  problemNotebook: { y: 1, name: "Problem & error notebook", where: "study" },
  projectLite: { y: 1, name: "Assignment / project lite", where: "projects" },
  scale: { y: 1, name: "Scale & dimension converter", where: "practice" },
  beam: { y: 2, name: "Simply-supported beam (V, M, deflection)", where: "practice" },
  section: { y: 2, name: "Section properties (I, Z, area)", where: "practice" },
  stats: { y: 2, name: "Statistics workbench", where: "practice" },
  constructionDetails: { y: 2, name: "Construction detail log", where: "practice" },
  renderLog: { y: 2, name: "Render & export log", where: "projects" },
  stairs: { y: 3, name: "Stair designer (Blondel 2R+G)", where: "practice" },
  levelling: { y: 3, name: "Levelling book (rise & fall)", where: "practice" },
  curve: { y: 3, name: "Horizontal road curve", where: "practice" },
  lux: { y: 3, name: "Lighting (lumen method)", where: "practice" },
  reverb: { y: 3, name: "Reverberation time (Sabine)", where: "practice" },
  water: { y: 3, name: "Water demand & tank sizing", where: "practice" },
  boq: { y: 4, name: "Bill of quantities", where: "practice" },
  sun: { y: 4, name: "Sun position & shading", where: "practice" },
  uvalue: { y: 4, name: "Wall U-value", where: "practice" },
  housing: { y: 4, name: "Housing density", where: "practice" },
  research: { y: 5, name: "Research & evidence workspace", where: "library" },
  gantt: { y: 5, name: "Project schedule (critical path)", where: "practice" },
  npv: { y: 5, name: "Engineering economics (NPV / IRR)", where: "practice" },
  lcc: { y: 5, name: "Life-cycle cost comparison", where: "practice" },
};
/* Civil Engineering — University of Kirkuk, College of Engineering (4 years, annual courses, "units").
   Stage 4 is the department's published curriculum (codes هـ.مد 401–410). Stages 1–3 are not published online:
   they follow the usual Iraqi civil-engineering sequence and are marked provisional until you confirm them. */
S5.PROGRAMS = {
  arch: { name: "Architecture & Building Technologies", ar: "هندسة تقنيات العمارة والبناء", univ: "Northern Technical University", years: 5, unit: "ECTS" },
  civil: { name: "Civil Engineering", ar: "الهندسة المدنية", univ: "University of Kirkuk — College of Engineering", years: 4, unit: "units" },
};
S5.CIVIL = [
  // year, code, Arabic, English, units, profile, official
  [1, "", "الرياضيات I", "Mathematics I", null, "math", false],
  [1, "", "الميكانيك الهندسي (السكون والحركة)", "Engineering Mechanics (Statics & Dynamics)", null, "structures", false],
  [1, "", "الرسم الهندسي", "Engineering Drawing", null, "drawing", false],
  [1, "", "الجيولوجيا الهندسية", "Engineering Geology", null, "materials", false],
  [1, "", "إنشاء المباني", "Building Construction", null, "construction", false],
  [1, "", "برمجة الحاسبات", "Computer Programming", null, "computing", false],
  [1, "", "الورش", "Workshops", null, "practical", false],
  [1, "", "حقوق الإنسان والديمقراطية", "Human Rights & Democracy", null, "general", false],
  [1, "", "اللغة الإنكليزية I", "English I", null, "general", false],
  [1, "", "اللغة العربية", "Arabic Language", null, "general", false],
  [2, "", "الرياضيات II", "Mathematics II", null, "math", false],
  [2, "", "مقاومة المواد", "Strength of Materials", null, "structures", false],
  [2, "", "ميكانيك الموائع", "Fluid Mechanics", null, "services", false],
  [2, "", "المساحة", "Surveying", null, "survey", false],
  [2, "", "مواد البناء وتكنولوجيا الخرسانة", "Building Materials & Concrete Technology", null, "materials", false],
  [2, "", "تطبيقات الحاسوب الهندسية", "Engineering Computer Applications", null, "computing", false],
  [2, "", "جرائم حزب البعث", "Crimes of the Baath Party", null, "general", false],
  [2, "", "اللغة الإنكليزية II", "English II", null, "general", false],
  [3, "", "نظرية الإنشاءات", "Theory of Structures", null, "structures", false],
  [3, "", "تصاميم الخرسانة المسلحة I", "Reinforced Concrete Design I", null, "structures", false],
  [3, "", "ميكانيك التربة", "Soil Mechanics", null, "materials", false],
  [3, "", "الهيدروليك", "Hydraulics", null, "services", false],
  [3, "", "التحليل الهندسي والطرق العددية", "Engineering Analysis & Numerical Methods", null, "math", false],
  [3, "", "الإحصاء الهندسي", "Engineering Statistics", null, "math", false],
  [3, "", "هندسة النقل", "Transportation Engineering", null, "survey", false],
  [3, "", "اللغة الإنكليزية III", "English III", null, "general", false],
  [4, "هـ.مد 401", "تصاميم الخرسانة المسلحة II", "Reinforced Concrete Design II", 4, "structures", true],
  [4, "هـ.مد 402", "تصميم المنشآت الحديدية", "Steel Structures Design", 4, "structures", true],
  [4, "هـ.مد 403", "منشآت هيدروليكية", "Hydraulic Structures", 4, "services", true],
  [4, "هـ.مد 404", "هندسة الأسس", "Foundation Engineering", 6, "structures", true],
  [4, "هـ.مد 405", "هندسة الطرق", "Highway Engineering", 5, "survey", true],
  [4, "هـ.مد 406", "الهندسة الصحية", "Sanitary Engineering", 5, "services", true],
  [4, "هـ.مد 407", "طرق الإنشاء والتخمين", "Construction Methods & Estimation", 4, "quantity", true],
  [4, "هـ.مد 408", "هيدرولوجي", "Hydrology", 4, "climate", true],
  [4, "هـ.مد 409", "المشروع الهندسي", "Engineering Project", 4, "research", true],
  [4, "هـ.مد 410", "اللغة الإنكليزية IV", "English IV", 2, "general", true],
];
S5.YEARS_CIVIL = [
  { n: 1, name: "Engineering foundations", ar: "الأسس الهندسية", focus: "Mathematics, mechanics, engineering drawing, geology, building construction, programming" },
  { n: 2, name: "Materials, mechanics & surveying", ar: "المواد والميكانيك والمساحة", focus: "Strength of materials, fluids, surveying, concrete technology" },
  { n: 3, name: "Structures, soils & water", ar: "الإنشاءات والتربة والمياه", focus: "Theory of structures, RC design I, soil mechanics, hydraulics, numerical methods, transportation" },
  { n: 4, name: "Design & infrastructure", ar: "التصميم والبنى التحتية", focus: "RC II, steel, foundations, highways, sanitary, hydraulic structures, estimation, project" },
];
// where the two programs teach the same thing — what you learn now counts in either path
S5.OVERLAP = [
  ["Mathematics", ["Principles of Calculus", "Differential Equations", "Statistics"], ["Mathematics I", "Mathematics II", "Engineering Analysis & Numerical Methods", "Engineering Statistics"]],
  ["Engineering drawing", ["Engineering Drawing", "Freehand Drawing 2D/3D"], ["Engineering Drawing"]],
  ["Mechanics & structures", ["Mechanics & Strength of Materials", "Structural Design"], ["Engineering Mechanics (Statics & Dynamics)", "Strength of Materials", "Theory of Structures", "Reinforced Concrete Design I", "Reinforced Concrete Design II", "Steel Structures Design"]],
  ["Materials & construction", ["Building Materials", "Building Construction", "Building Construction: Stairs & Floors", "Advanced Building Technologies", "Technical Construction"], ["Building Construction", "Building Materials & Concrete Technology", "Construction Methods & Estimation"]],
  ["Surveying & roads", ["Engineering Surveying", "Road Design"], ["Surveying", "Transportation Engineering", "Highway Engineering"]],
  ["Water & sanitary", ["Sanitary Services"], ["Fluid Mechanics", "Hydraulics", "Sanitary Engineering", "Hydraulic Structures", "Hydrology"]],
  ["Quantities & management", ["Quantity Surveying & Specifications", "Project Management & Engineering Economics"], ["Construction Methods & Estimation"]],
  ["Computing", ["Computer Fundamentals", "Computer Applications"], ["Computer Programming", "Engineering Computer Applications"]],
  ["Languages & general", ["English Language", "Arabic Language", "Democracy & Human Rights"], ["English I", "Arabic Language", "Human Rights & Democracy"]],
];
// the year each tool turns on in the civil path
S5.TOOLS_CIVIL_YEAR = { scale: 1, beam: 2, section: 2, levelling: 2, stats: 3, water: 3, curve: 3, stairs: 1, boq: 4, gantt: 4, npv: 4, uvalue: 2, lux: 4, reverb: 4, sun: 4, housing: 4, lcc: 4, drawingCoach: 1, materialCards: 1, problemNotebook: 1, projectLite: 1, research: 4 };
S5.progOn = (p) => (S5.settings.get("programs") || ["arch", "civil"]).includes(p || "arch");
S5.subjectActive = (s) => !!s && S5.progOn(s.program) && S5.yearActive(s.year);
S5.inSemester = (s, sem) => (s.program === "civil" ? s.year === Math.ceil(sem / 2) : s.semester === sem);
S5.unitLabel = (s) => (s.program === "civil" ? "units" : "ECTS");
S5.seedCivil = async () => {
  if (S5.store.list("subject", (x) => x.program === "civil").length) return;
  const t = S5.now(); const recs = [];
  S5.CIVIL.forEach((c, i) => recs.push({ id: "civ_" + String(i + 1).padStart(2, "0"), type: "subject", program: "civil", year: c[0], semester: c[0] * 2 - 1, annual: true, code: c[1], ar: c[2], name: c[3], ects: c[4], profile: c[5], professor: "", source: c[6] ? "University of Kirkuk, Civil Engineering curriculum (stage 4)" : "Provisional — typical Iraqi civil engineering sequence; confirm with the department", provisional: !c[6], createdAt: t, updatedAt: t, rev: 1 }));
  recs.push({ id: "disc_civil", type: "discrepancy", title: "Civil engineering stages 1–3", text: "The University of Kirkuk publishes only the stage-4 civil curriculum online. Stages 1–3 here follow the usual Iraqi civil engineering sequence and have no unit values yet. Replace them with the department's official list when you get it (edit each subject).", status: "open", source: "uokirkuk.edu.iq", createdAt: t, updatedAt: t, rev: 1 });
  for (const sub of S5.store.list("subject", (x) => !x.program)) recs.push({ ...sub, program: "arch", updatedAt: t, rev: (sub.rev || 0) + 1 });
  await S5.idb.putMany("records", recs.map((r) => [r.id, r]));
  recs.forEach((r) => { S5.store.recs.set(r.id, r); S5.sync.queue(r); });
};
S5.yearActive = (n) => n <= S5.settings.get("activeYear") || !!(S5.settings.get("flags") || {})["year" + n];
S5.toolOn = (key) => { const t = S5.TOOLS[key]; if (!t) return false; const f = S5.settings.get("flags") || {}; if (f["tool_" + key] === false) return false; return (S5.progOn("arch") && S5.yearActive(t.y)) || (S5.progOn("civil") && S5.yearActive(S5.TOOLS_CIVIL_YEAR[key] || 9)) || f["tool_" + key] === true; };
S5.subjectPacks = (s) => (S5.PROFILES[s.profile] || S5.PROFILES.general).packs;
S5.hasPack = (s, p) => S5.subjectPacks(s).includes(p);

S5.seedCurriculum = async () => {
  if (S5.store.list("subject").length) return;
  const recs = [];
  const t = S5.now();
  for (const y of S5.YEARS) recs.push({ id: "year_" + y.n, type: "year", n: y.n, name: y.name, ar: y.ar, createdAt: t, updatedAt: t, rev: 1 });
  for (let s = 1; s <= 10; s++) {
    const ects = S5.CURRICULUM.filter((c) => c[1] === s).reduce((a, c) => a + c[4], 0);
    recs.push({ id: "sem_" + s, type: "semester", n: s, year: Math.ceil(s / 2), declaredEcts: 30, listedEcts: ects, createdAt: t, updatedAt: t, rev: 1 });
  }
  S5.CURRICULUM.forEach((c, i) => {
    recs.push({ id: "sub_" + String(i + 1).padStart(2, "0"), type: "subject", program: "arch", year: c[0], semester: c[1], ar: c[2], name: c[3], ects: c[4], profile: c[5], professor: "", room: "", color: "", createdAt: t, updatedAt: t, rev: 1, source: "Program_Catalogue-ar-1.pdf" });
  });
  recs.push({ id: "disc_sem2", type: "discrepancy", title: "Semester 2 credits", text: "Catalogue declares 30 ECTS for semester 2, but the listed subjects add up to 25 ECTS. No subject was invented to fill the gap; confirm with the department.", status: "open", source: "Program_Catalogue-ar-1.pdf", createdAt: t, updatedAt: t, rev: 1 });
  // skills hierarchy (Skills Map)
  const skills = { Drawing: ["Line confidence", "Freehand perspective", "Orthographic projection", "Line weights & symbols", "Sketching people & scale"], Design: ["Brief analysis", "Space programming", "Concept generation", "Composition & proportion", "Design critique"], Analysis: ["Site analysis", "Precedent analysis", "Climate response"], Software: ["CAD drafting", "3D modelling", "Rendering", "Layout & boards"], Construction: ["Materials knowledge", "Construction details", "Structural intuition"], Systems: ["Sanitary", "Electrical", "Lighting & acoustics"], Presentation: ["Verbal presentation", "Board composition"], Research: ["Source evaluation", "Academic writing", "Citation"], Time: ["Estimation", "Deadline control"] };
  for (const [parent, kids] of Object.entries(skills)) {
    const pid = "skill_" + parent.toLowerCase();
    recs.push({ id: pid, type: "skill", name: parent, parent: "", state: 0, createdAt: t, updatedAt: t, rev: 1 });
    kids.forEach((k, i) => recs.push({ id: pid + "_" + i, type: "skill", name: k, parent: pid, state: 0, active: false, evidence: [], createdAt: t, updatedAt: t, rev: 1 }));
  }
  // Drawing Coach curriculum
  S5.DRILLS.forEach((d) => recs.push({ ...d, type: "drillDef", createdAt: t, updatedAt: t, rev: 1 }));
  // material cards (year one starter set)
  S5.MATERIALS.forEach((m, i) => recs.push({ id: "mat_" + i, type: "material", ...m, source: "Studio5 starter card — verify against your lectures", confidence: "starter", createdAt: t, updatedAt: t, rev: 1 }));
  await S5.idb.putMany("records", recs.map((r) => [r.id, r]));
  recs.forEach((r) => { S5.store.recs.set(r.id, r); S5.sync.queue(r); });
};

S5.DRILLS = [
  { id: "drl_f1", track: "Freehand", level: 1, name: "Straight-line confidence", goal: "Draw 20 parallel lines, 15 cm, one stroke each, no feathering.", minutes: 10, guide: "lines", checks: ["Lines are single strokes", "Spacing stays even", "Ends are crisp, not hooked", "Speed stays steady"] },
  { id: "drl_f2", track: "Freehand", level: 1, name: "Ellipses & circles", goal: "Fill the page with ellipses at 5 different degrees, 2 passes each.", minutes: 10, guide: "none", checks: ["Axis is consistent", "No flat spots", "Degrees are distinguishable"] },
  { id: "drl_f3", track: "Freehand", level: 2, name: "Boxes in space", goal: "Draw 12 boxes floating in space; check convergence with extended edges.", minutes: 15, guide: "2pt", checks: ["Edges converge to shared points", "Boxes do not look distorted", "Line weight shows front edges"] },
  { id: "drl_f4", track: "Freehand", level: 3, name: "Contour of a real object", goal: "Draw a chair or a plant from life with blind contour then a checked contour.", minutes: 20, guide: "none", checks: ["Proportions measured with pencil", "Overlaps read clearly", "Negative spaces checked"] },
  { id: "drl_p1", track: "Perspective", level: 1, name: "One-point room", goal: "Construct an interior in one-point perspective with a door, window and table.", minutes: 20, guide: "1pt", checks: ["All depth lines meet the VP", "Horizon at eye level", "Verticals stay vertical", "Furniture sits on the floor plane"] },
  { id: "drl_p2", track: "Perspective", level: 2, name: "Two-point street corner", goal: "Draw a building corner with two vanishing points and repeated windows.", minutes: 25, guide: "2pt", checks: ["Window spacing shrinks correctly", "Both VPs on the horizon", "Eye level matches people's heads"] },
  { id: "drl_p3", track: "Perspective", level: 3, name: "Measuring depth (diagonals)", goal: "Divide a receding wall into 6 equal bays using the diagonal method.", minutes: 20, guide: "1pt", checks: ["Diagonals pass through midpoints", "Bays shrink smoothly"] },
  { id: "drl_e1", track: "Engineering", level: 1, name: "Line types & weights", goal: "Reproduce visible, hidden, centre, section and dimension lines at correct weights.", minutes: 15, guide: "grid", checks: ["Hidden dashes are even", "Centre lines are long-short-long", "Weights are clearly distinct"] },
  { id: "drl_e2", track: "Engineering", level: 2, name: "Orthographic projection", goal: "Draw plan, front and side views of a stepped block in first-angle projection.", minutes: 25, guide: "grid", checks: ["Views align by projection", "Hidden edges shown", "Correct view placement for first angle"] },
  { id: "drl_e3", track: "Engineering", level: 2, name: "Dimensioning", goal: "Dimension a small plan at 1:50 with chain and overall dimensions.", minutes: 20, guide: "grid", checks: ["Dimension lines outside the drawing", "Text readable from bottom/right", "No duplicated dimensions"] },
  { id: "drl_e4", track: "Engineering", level: 3, name: "Isometric from orthographic", goal: "Convert three orthographic views into an isometric drawing.", minutes: 25, guide: "iso", checks: ["Axes at 30°", "True lengths on isometric axes", "Hidden edges omitted"] },
  { id: "drl_a1", track: "Architectural", level: 1, name: "Plan symbols", goal: "Draw a 4 × 5 m room plan at 1:50 with door swing, window, wall hatch.", minutes: 20, guide: "grid", checks: ["Wall thickness to scale", "Door swing correct", "Cut lines heaviest"] },
  { id: "drl_a2", track: "Architectural", level: 2, name: "Section through a room", goal: "Draw a section with floor slab, walls, opening and ground line at 1:50.", minutes: 25, guide: "grid", checks: ["Cut elements heaviest", "Levels marked", "Ground line distinct"] },
];
S5.MATERIALS = [
  { name: "Clay brick (Iraqi standard)", category: "Masonry", properties: "Approx. 240 × 115 × 75 mm; compressive strength classes per Iraqi spec 25", uses: "Load-bearing and partition walls", notes: "Check water absorption and efflorescence", safety: "Wear gloves; cut with eye protection" },
  { name: "Concrete block", category: "Masonry", properties: "Hollow or solid; common 400 × 200 × 200 mm", uses: "Walls, boundary walls", notes: "Lighter than solid concrete; check curing", safety: "Lift with straight back" },
  { name: "Portland cement", category: "Binders", properties: "Hydraulic binder; sets with water", uses: "Concrete, mortar, plaster", notes: "Store dry; use before it lumps", safety: "Alkaline — avoid skin and eye contact" },
  { name: "Gypsum (juss)", category: "Binders", properties: "Fast-setting, interior use", uses: "Plaster, traditional Iraqi finishes", notes: "Weak in moisture", safety: "Dust mask when mixing" },
  { name: "Reinforcing steel", category: "Metals", properties: "Deformed bars, grade per spec", uses: "Reinforced concrete", notes: "Check cover and laps", safety: "Cap exposed bar ends" },
  { name: "Timber (softwood)", category: "Timber", properties: "Light, workable; moisture-sensitive", uses: "Formwork, doors, roofs", notes: "Check grain and knots", safety: "Hand tools: cut away from body" },
  { name: "Glass (float)", category: "Glazing", properties: "Brittle; thickness 4–12 mm", uses: "Windows, partitions", notes: "Tempered for safety zones", safety: "Gloves; carry upright" },
  { name: "Thermostone (AAC)", category: "Masonry", properties: "Autoclaved aerated concrete; low density, insulating", uses: "Walls with better thermal performance", notes: "Needs suitable mortar and fixings", safety: "Dust mask when cutting" },
];

/* ---------- example data, clearly marked, removable in one click ---------- */
S5.seedDemo = async () => {
  if (S5.store.meta.demoSeeded) return;
  const T = S5.todayISO();
  const D = (n) => S5.addDays(T, n);
  const wd = new Date().getDay();
  const mk = (type, f) => S5.store.create(type, { ...f, demo: true });
  // timetable for semester-1 subjects
  const slots = [["sub_01", wd, "08:30", "11:30", "Studio 2"], ["sub_03", wd, "12:00", "13:30", "Hall B"], ["sub_02", (wd + 1) % 7, "08:30", "11:00", "Studio 1"], ["sub_04", (wd + 1) % 7, "11:30", "13:00", "Hall A"], ["sub_06", (wd + 2) % 7, "09:00", "10:30", "Room 14"], ["sub_05", (wd + 3) % 7, "10:00", "11:00", "Hall C"], ["sub_01", (wd + 3) % 7, "11:30", "14:30", "Studio 2"]];
  for (const [subjectId, day, start, end, room] of slots) await mk("slot", { subjectId, day, start, end, room, kind: "lecture" });
  await S5.store.update("sub_01", { professor: "Dr. Example (studio)" });
  const lec = await mk("lecture", { subjectId: "sub_03", date: D(-2), title: "Limits and continuity", topic: "Limits", status: "captured" });
  await mk("capture", { lectureId: lec.id, subjectId: "sub_03", kind: "gap", text: "Why does the limit exist when the function is undefined at the point?", page: 14, resolved: false });
  await mk("capture", { lectureId: lec.id, subjectId: "sub_03", kind: "deadline", text: "Homework sheet 2 — problems 1–8", due: D(3), resolved: false });
  await mk("capture", { lectureId: lec.id, subjectId: "sub_03", kind: "verbatim", text: "«في الامتحان لازم تكتب كل خطوة، الجواب بدون خطوات ما ينحسب»", resolved: false });
  await mk("task", { title: "Sketch 3 concept massing options", subjectId: "sub_01", due: D(2), priority: "high", estimateMin: 120, status: "open", origin: "manual" });
  await mk("task", { title: "Ink the one-point perspective room", subjectId: "sub_02", due: D(1), priority: "normal", estimateMin: 60, status: "open", origin: "manual" });
  await mk("task", { title: "Read chapter 2: elements of design", subjectId: "sub_04", due: D(5), priority: "normal", estimateMin: 45, status: "open", origin: "manual" });
  await mk("assessment", { subjectId: "sub_03", kind: "Midterm exam", date: D(12), weight: 20, weightMin: 15, weightMax: 25, weightSource: "Professor said 15–25%", confirmed: false, score: null, maxScore: 100, topics: "Limits, continuity, derivatives basics" });
  await mk("assessment", { subjectId: "sub_03", kind: "Quiz 1", date: D(-5), weight: 5, weightSource: "Course description", confirmed: true, score: 7, maxScore: 10 });
  await mk("assessment", { subjectId: "sub_01", kind: "Project 1 submission", date: D(9), weight: 25, weightSource: "Brief sheet", confirmed: true, score: null, maxScore: 100 });
  for (const [name, mastery] of [["Limits", 2], ["Continuity", 1], ["Derivative definition", 0]]) await mk("topic", { subjectId: "sub_03", name, scope: "in", mastery });
  const prj = await mk("project", { name: "Project 1 — A pavilion in the park", subjectId: "sub_01", professor: "Dr. Example (studio)", deadline: D(9), internalDeadline: D(7), mode: "individual", phase: "alternatives", nextAction: "Choose between alternatives A and B using the decision matrix", weight: 25 });
  await mk("requirement", { projectId: prj.id, text: "Covered area between 60 and 80 m²", source: "Brief sheet p.1", mandatory: true, status: "open" });
  await mk("requirement", { projectId: prj.id, text: "Plan, two elevations, one section at 1:50", source: "Brief sheet p.2", mandatory: true, status: "open" });
  await mk("requirement", { projectId: prj.id, text: "A3 board, hand-drawn", source: "Professor, studio 1", mandatory: true, status: "met" });
  await mk("assumption", { projectId: prj.id, text: "Site slope is negligible", reason: "No survey given", impact: "Section ground line", needsConfirm: true });
  await mk("alternative", { projectId: prj.id, name: "A — Courtyard ring", idea: "Shaded ring around a tree", strength: "Strong climate response", weakness: "Long circulation", status: "active", scores: { c1: 4, c2: 3, c3: 4 } });
  await mk("alternative", { projectId: prj.id, name: "B — Folded roof", idea: "One folded plate roof over open floor", strength: "Clear single gesture", weakness: "Structure unclear", status: "active", scores: { c1: 3, c2: 5, c3: 2 } });
  await mk("feedback", { projectId: prj.id, verbatim: "«المدخل مو واضح، لازم يبين من الشارع»", interpretation: "Entrance must be visible and legible from the street side.", priority: "high", understood: true, status: "open", element: "Entrance" });
  for (const [kind, scale] of [["Plan", "1:50"], ["Section", "1:50"], ["Elevation", "1:50"], ["Board", "A3"]]) await mk("deliverable", { projectId: prj.id, kind, scale, status: kind === "Plan" ? "draft" : "not started", estMin: kind === "Board" ? 240 : 150 });
  await mk("space", { projectId: prj.id, name: "Open pavilion", count: 1, area: 48, privacy: "public" });
  await mk("space", { projectId: prj.id, name: "Kiosk", count: 1, area: 9, privacy: "semi" });
  await mk("space", { projectId: prj.id, name: "WC", count: 2, area: 4, privacy: "private" });
  await mk("problem", { subjectId: "sub_03", question: "lim x→2 of (x² − 4)/(x − 2)", source: "Lecture 3, p.14", attempt: "Substituted directly and got 0/0, stopped", correct: "Factor: (x−2)(x+2)/(x−2) → 4", errorType: "application", cause: "Did not recognise the indeterminate form needs factoring", retryAt: D(2), status: "retry" });
  await mk("memory", { kind: "professor", text: "Studio professor asks for scale figures in every elevation.", stage: 1, context: "Architectural Drawing & Design" });
  await mk("session", { subjectId: "sub_03", reason: "Close the limits gap before the midterm", plannedMin: 45, output: "8 solved homework problems", criterion: "Solve 6/8 without hints", date: T, done: false });
  await S5.store.setMeta("demoSeeded", true);
};
S5.clearDemo = async () => {
  const demo = [...S5.store.recs.values()].filter((r) => r.demo);
  for (const r of demo) { S5.store.recs.delete(r.id); await S5.idb.del("records", r.id); S5.sync.removeRemote(r.id); }
  await S5.store.update("sub_01", { professor: "" });
  await S5.store.setMeta("demoCleared", true);
  S5.audit("demo", `Removed ${demo.length} example records`);
  S5.bus.emit("change", null);
};

/* College M8 — the Jury room: a studio pin-up with a rubric (docs/COLLEGE_PLAN.md §M8).
   Flow, like a real first-year review: pin up a board (photo or ink page, downscaled to ≤1280 px, JPEG 0.85) and
   state the intent → score yourself first (E0) → an AI juror reads the board against the rubric (E1, advice only)
   → type in the professor's or jury's scores verbatim (EP) → compare the three in a calibration table.
   Code, never the AI, decides what counts: the juror's reply is validated (unknown criteria dropped, levels
   clamped to 1–4) and every weighted total is computed here. Nothing in this file writes `attempt` records,
   tutorProg or studioProg, so no jury score can ever change mastery. Rubrics are static content in code
   (not seeded records); a pin-up is one `jury` record (additive type, no migration). */
(() => {
  const J = (S5.jury = S5.jury || {});
  const esc = S5.esc;
  J.BUDGET = 6; // AI juror requests per day (per device)
  J.MAXPX = 1280; J.QUALITY = 0.85;
  J.PURPOSE = "Jury";
  /* evidence tiers used by the jury (the plan's E0/E1/EP); S5.TIERS from the engine is used when present */
  J.TIER = { self: "E0", ai: "E1", prof: "EP" };
  J.LEVELS = [
    { n: 1, en: "Beginning", ar: "مبتدئ" },
    { n: 2, en: "Developing", ar: "قيد التطوّر" },
    { n: 3, en: "Proficient", ar: "متمكّن" },
    { n: 4, en: "Exemplary", ar: "متميّز" },
  ];
  const L = (en, ar) => ({ en, ar });
  const crit = (id, w, en, ar, lv) => ({ id, w, en, ar, lv: lv.map(([e, a]) => L(e, a)) });

  /* ---------- three Year-1 architecture rubrics: written for this app, vocabulary aligned with a first-year
     design studio (Harvard GSD 1101-level topics), never copied. Weights add up to 100. ---------- */
  S5.RUBRICS = S5.RUBRICS || {};
  Object.assign(S5.RUBRICS, {
    comp: {
      id: "comp", v: 1, en: "Composition of primary forms", ar: "التكوين بالأشكال الأولية",
      brief: L("Compose three to five primary solids (cube, prism, cylinder, cone or pyramid, sphere) into one unified composition. Pin up a photo of the model or the drawings (plan, elevation and one view) and state the ordering idea in one or two sentences.",
        "كوّن من ثلاثة إلى خمسة مجسّمات أولية (مكعب، منشور، أسطوانة، مخروط أو هرم، كرة) تكويناً واحداً متماسكاً. علّق صورة المجسّم أو الرسومات (مسقط وواجهة ومنظور واحد) واكتب فكرة النظام في جملة أو جملتين."),
      criteria: [
        crit("order", 20, "Ordering idea and hierarchy", "فكرة النظام والتدرّج الهرمي", [
          ["No clear ordering idea; the forms read as separate objects of equal importance.", "لا توجد فكرة نظام واضحة؛ تُقرأ الأشكال كقطع منفصلة متساوية الأهمية."],
          ["An ordering idea is hinted at (an axis, a grid or symmetry) but breaks in places; the dominant form is unclear.", "تظهر فكرة نظام بشكل خافت (محور أو شبكة أو تناظر) لكنها تنكسر في مواضع، والشكل المهيمن غير واضح."],
          ["A clear ordering principle (axis, datum, rhythm or symmetry) with one dominant form and readable subordinate forms.", "مبدأ نظام واضح (محور أو خط مرجعي أو إيقاع أو تناظر) مع شكل مهيمن واحد وأشكال تابعة مقروءة."],
          ["The ordering principle governs every decision; the hierarchy reads at once from any view and the exceptions are deliberate.", "مبدأ النظام يحكم كل قرار؛ يُقرأ التدرّج الهرمي فوراً من أي زاوية، والاستثناءات مقصودة."]]),
        crit("relate", 20, "Relationships between forms", "العلاقات بين الأشكال", [
          ["Forms are only placed next to each other; the joints are accidental.", "الأشكال موضوعة بجانب بعضها فقط، والوصلات بينها عشوائية."],
          ["One kind of relationship is used (for example stacking) without studying how the forms meet.", "استُخدم نوع واحد من العلاقات (مثل التكديس) دون دراسة كيف تلتقي الأشكال."],
          ["Several relationships (touching, overlapping, interlocking, subtraction) are used on purpose and each joint reads clearly.", "استُخدمت عدة علاقات (تماس، تراكب، تداخل، طرح) عن قصد، وكل وصلة مقروءة بوضوح."],
          ["The way the forms meet carries the idea: each joint shows which form leads and which one yields.", "طريقة التقاء الأشكال تحمل الفكرة: كل وصلة تبيّن أي شكل يقود وأيّها يتراجع."]]),
        crit("propor", 15, "Proportion and scale", "التناسب والمقياس", [
          ["Sizes look arbitrary; there is no relation between the dimensions of the forms.", "الأحجام تبدو اعتباطية، ولا علاقة بين أبعاد الأشكال."],
          ["Some size relations are intended but they are inconsistent between plan and elevation.", "بعض علاقات الأحجام مقصودة لكنها غير متّسقة بين المسقط والواجهة."],
          ["Dimensions follow a deliberate ratio or module, and the forms hold together as one family.", "الأبعاد تتبع نسبة أو وحدة قياس مقصودة، والأشكال تتماسك كعائلة واحدة."],
          ["A proportional system (a module, a ratio such as 1:2, or the golden section) is explicit, measured and shown on the drawings.", "نظام تناسبي (وحدة قياس أو نسبة مثل 1:2 أو النسبة الذهبية) صريح ومقاس ومبيّن على الرسومات."]]),
        crit("void", 15, "Solid and void (figure and ground)", "الكتلة والفراغ (الشكل والأرضية)", [
          ["Only the solids were designed; the spaces between them are leftovers.", "صُمّمت الكتل فقط، والفراغات بينها بقايا غير مقصودة."],
          ["Some voids are noticed but not shaped; the ground plane is ignored.", "بعض الفراغات ملحوظة لكنها غير مشكَّلة، ومستوى الأرضية مُهمَل."],
          ["The voids between the forms are shaped as positive spaces, and the base or ground plane is part of the composition.", "الفراغات بين الأشكال مشكَّلة كفراغات إيجابية، والقاعدة أو مستوى الأرضية جزء من التكوين."],
          ["Solid and void hold each other in balanced tension; a figure-ground reading of the plan confirms the idea.", "الكتلة والفراغ في توازن مشدود، وقراءة الشكل والأرضية في المسقط تؤكّد الفكرة."]]),
        crit("intent", 15, "Legibility of the intent", "وضوح الفكرة المعلنة", [
          ["The board does not show what the intent statement claims.", "اللوحة لا تُظهر ما يقوله بيان الفكرة."],
          ["The intent becomes visible only after it is explained.", "الفكرة لا تظهر إلا بعد شرحها."],
          ["A viewer can find the stated intent on the board without help.", "يستطيع المشاهد أن يجد الفكرة المعلنة على اللوحة دون مساعدة."],
          ["The intent is the first thing the board says; the views and diagrams were chosen to prove it.", "الفكرة أول ما تقوله اللوحة، والمناظر والمخططات اختيرت لإثباتها."]]),
        crit("craft", 15, "Craft and representation", "الإتقان والإظهار", [
          ["Rough edges, unclean joints or smudged lines distract from the composition.", "حواف خشنة أو وصلات غير نظيفة أو خطوط ملطّخة تشتّت الانتباه عن التكوين."],
          ["Mostly clean, but the line weights or the cuts are uneven.", "نظيف غالباً، لكن سماكات الخطوط أو القصّ غير متساوية."],
          ["Clean model or drawings with a clear line-weight hierarchy; the views are aligned and labelled.", "مجسّم أو رسومات نظيفة بتدرّج واضح في سماكات الخطوط، والمناظر متحاذية ومعنونة."],
          ["Precise, consistent craft throughout; the presentation itself reinforces the ordering idea.", "إتقان دقيق ومتّسق في كل شيء، والإظهار نفسه يعزّز فكرة النظام."]]),
      ],
    },
    bubble: {
      id: "bubble", v: 1, en: "Bubble diagram and zoning", ar: "المخطط الفقاعي والتنطيق",
      brief: L("For a small programme (for example a courtyard house or a small studio building), draw a bubble (adjacency) diagram, then translate it into a zoning diagram on the site that shows the entry, the orientation and the circulation.",
        "لبرنامج صغير (مثل بيت بفناء أو مبنى مرسم صغير) ارسم مخططاً فقاعياً (مخطط تجاورات)، ثم حوّله إلى مخطط تنطيق على الموقع يبيّن المدخل والتوجيه والحركة."),
      criteria: [
        crit("prog", 15, "Programme and relative size", "البرنامج والأحجام النسبية", [
          ["Spaces are missing, or all the bubbles are the same size.", "فضاءات ناقصة، أو الفقاعات كلها بحجم واحد."],
          ["All the main spaces appear, but the bubble sizes do not reflect their areas.", "تظهر الفضاءات الرئيسية كلها، لكن أحجام الفقاعات لا تعكس مساحاتها."],
          ["A complete programme; bubble sizes are roughly proportional to the area schedule.", "برنامج كامل، وأحجام الفقاعات متناسبة تقريباً مع جدول المساحات."],
          ["A complete programme with an area schedule; sizes are proportional and grouped into clear clusters.", "برنامج كامل مع جدول مساحات، والأحجام متناسبة ومجمّعة في عناقيد واضحة."]]),
        crit("adj", 25, "Adjacencies", "علاقات التجاور", [
          ["Lines connect everything to everything; critical adjacencies are missed.", "الخطوط تربط كل شيء بكل شيء، والتجاورات الحرجة مفقودة."],
          ["The main adjacencies are drawn, but strong and weak links are not distinguished.", "رُسمت التجاورات الرئيسية لكن دون تمييز الروابط القوية من الضعيفة."],
          ["Strong, weak and no-link relations are distinguished with a legend; critical pairs (for example kitchen and dining) are right.", "مُيّزت العلاقات القوية والضعيفة وعدم الارتباط بمفتاح رموز، والأزواج الحرجة (مثل المطبخ وغرفة الطعام) صحيحة."],
          ["Adjacencies are justified by use and conflicts are resolved (noise, privacy, service access); the diagram is minimal and clear.", "التجاورات مبرَّرة بالاستعمال، والتعارضات محلولة (الضوضاء والخصوصية ومدخل الخدمة)، والمخطط مختصر وواضح."]]),
        crit("zone", 20, "Zoning: public to private, served and servant", "التنطيق: من العام إلى الخاص، والمخدوم والخادم", [
          ["No zoning; public and private spaces are mixed.", "لا يوجد تنطيق، والفضاءات العامة والخاصة مختلطة."],
          ["Zones are named, but their boundaries overlap or contradict the bubbles.", "سُمّيت المناطق لكن حدودها متداخلة أو تناقض الفقاعات."],
          ["A clear gradient from public to semi-private to private, and the service spaces are grouped.", "تدرّج واضح من العام إلى شبه الخاص إلى الخاص، والفضاءات الخدمية مجمّعة."],
          ["The zoning gradient, with served and servant spaces, structures the whole plan and respects local privacy customs (for example the guest reception kept apart from the family areas).", "تدرّج التنطيق، مع الفضاءات المخدومة والخادمة، ينظّم المخطط كله ويحترم أعراف الخصوصية المحلية (مثل فصل استقبال الضيوف عن مناطق العائلة)."]]),
        crit("circ", 15, "Circulation and thresholds", "الحركة والعتبات", [
          ["No entry and no circulation are shown.", "لا يظهر مدخل ولا حركة."],
          ["An entry is shown, but the routes cross private zones.", "يظهر مدخل، لكن مسارات الحركة تخترق المناطق الخاصة."],
          ["A clear entry sequence and circulation spine; the thresholds between zones are marked.", "تسلسل دخول واضح وعمود حركة رئيسي، والعتبات بين المناطق محدّدة."],
          ["Circulation is efficient and experiential: entry, transition and arrival are designed, and the service routes are separate.", "الحركة كفوءة وغنية بالتجربة: الدخول والانتقال والوصول مصمَّمة، ومسارات الخدمة منفصلة."]]),
        crit("site", 15, "Site and climate response", "الاستجابة للموقع والمناخ", [
          ["The site, the north arrow and the sun are missing.", "الموقع وسهم الشمال والشمس غير موجودة."],
          ["North and access are shown but do not influence the zoning.", "يظهر الشمال والوصول لكنهما لا يؤثّران في التنطيق."],
          ["The zoning responds to the sun path, access and views; living spaces avoid the harsh west sun.", "التنطيق يستجيب لمسار الشمس والوصول والإطلالات، وفضاءات المعيشة تتجنّب شمس الغرب القاسية."],
          ["Orientation, the prevailing north-west wind, shade and views work together, as in a courtyard strategy suited to the Iraqi climate.", "التوجيه والرياح الشمالية الغربية السائدة والظل والإطلالات تعمل معاً، كما في استراتيجية الفناء الملائمة لمناخ العراق."]]),
        crit("graph", 10, "Graphic clarity", "وضوح الإظهار", [
          ["Hard to read: no labels and no legend.", "صعب القراءة: بلا تسميات ولا مفتاح رموز."],
          ["Labels exist, but the line hierarchy is flat.", "توجد تسميات، لكن تدرّج الخطوط مسطّح."],
          ["Labels, a legend, a north arrow and a readable line hierarchy.", "تسميات ومفتاح رموز وسهم شمال وتدرّج خطوط مقروء."],
          ["Reads from pin-up distance; colour or tone codes the zones consistently in both diagrams.", "يُقرأ من مسافة التعليق، واللون أو الدرجة يرمّز المناطق باتّساق في المخططين."]]),
      ],
    },
    persp: {
      id: "persp", v: 1, en: "Freehand perspective sheet", ar: "لوحة منظور يدوي حر",
      brief: L("One A3 sheet of freehand perspective: an interior or a street corner in one- or two-point perspective, with people for scale and one consistent light source.",
        "لوحة A3 واحدة بالمنظور اليدوي الحر: فضاء داخلي أو زاوية شارع بمنظور بنقطة تلاشٍ واحدة أو نقطتين، مع أشخاص لإعطاء المقياس ومصدر ضوء واحد ثابت."),
      criteria: [
        crit("constr", 25, "Perspective construction", "بناء المنظور", [
          ["No consistent horizon line; the receding lines do not meet.", "لا يوجد خط أفق ثابت، والخطوط المتراجعة لا تلتقي."],
          ["A horizon and vanishing points exist, but several lines miss them or the verticals lean.", "يوجد خط أفق ونقاط تلاشٍ، لكن خطوطاً عدّة تخطئها أو تميل الخطوط الرأسية."],
          ["Receding lines converge on the vanishing points of one horizon; verticals stay vertical.", "الخطوط المتراجعة تتلاقى في نقاط التلاشي على خط أفق واحد، والخطوط الرأسية تبقى رأسية."],
          ["The construction is accurate and the eye level is chosen to serve the view; secondary vanishing points (stairs, ramps) are handled correctly.", "البناء دقيق ومستوى النظر مختار لخدمة المشهد، ونقاط التلاشي الثانوية (الدرج والمنحدرات) معالَجة بشكل صحيح."]]),
        crit("fore", 20, "Proportion and foreshortening", "التناسب والتقاصر", [
          ["Objects keep their real size with distance; the depth reads flat.", "تحتفظ الأشياء بحجمها الحقيقي مع البعد، والعمق يُقرأ مسطّحاً."],
          ["Depth is suggested, but the spacing of repeated elements (columns, tiles) is wrong.", "العمق موحى به، لكن تباعد العناصر المتكرّرة (الأعمدة والبلاط) خاطئ."],
          ["Repeated elements diminish correctly, and the proportions of openings and furniture are believable.", "العناصر المتكرّرة تتصاغر بشكل صحيح، ونسب الفتحات والأثاث مقنعة."],
          ["Foreshortening is measured (diagonal or grid method) and the space feels exactly its intended size.", "التقاصر مقاس (بطريقة القطر أو الشبكة)، والفضاء يبدو بحجمه المقصود تماماً."]]),
        crit("line", 20, "Line quality and weight hierarchy", "جودة الخط وتدرّج سماكته", [
          ["Hesitant, hairy or repeated strokes; every line has the same weight.", "خطوط متردّدة أو مشعّرة أو مكرّرة، وكل الخطوط بسماكة واحدة."],
          ["Mostly confident lines, but little difference between profile, edge and texture lines.", "خطوط واثقة غالباً، لكن الفرق ضئيل بين خطوط المحيط والحواف والملمس."],
          ["Confident single strokes with a clear hierarchy: profile lines heaviest, texture lines lightest.", "خطوط واثقة بضربة واحدة مع تدرّج واضح: خطوط المحيط الأثقل وخطوط الملمس الأخف."],
          ["Line weight also expresses depth (near heavy, far light) and the drawing breathes with economy.", "سماكة الخط تعبّر أيضاً عن العمق (القريب ثقيل والبعيد خفيف)، والرسم يتنفّس باقتصاد."]]),
        crit("tone", 15, "Tone, light and shadow", "الدرجات والضوء والظل", [
          ["No tone, or shading without a light source.", "بلا درجات، أو تظليل بلا مصدر ضوء."],
          ["A light source is implied, but the shades and cast shadows contradict it in places.", "مصدر الضوء ضمني، لكن الظلال الذاتية والساقطة تناقضه في مواضع."],
          ["One consistent light source; at least three distinct values separate the planes.", "مصدر ضوء واحد ثابت، وثلاث درجات متمايزة على الأقل تفصل المستويات."],
          ["Light is used to compose: cast shadows are constructed and the value range leads the eye to the focal point.", "الضوء مستخدم في التكوين: الظلال الساقطة مُنشأة، ومدى الدرجات يقود العين إلى نقطة التركيز."]]),
        crit("scale", 10, "Scale and entourage", "المقياس والعناصر المرافقة", [
          ["No people or familiar objects; the scale cannot be read.", "لا أشخاص ولا أشياء مألوفة، ولا يمكن قراءة المقياس."],
          ["Figures are present, but their heads do not sit on the eye-level line for their distance.", "توجد شخوص، لكن رؤوسها لا تقع على خط مستوى النظر حسب بُعدها."],
          ["People, trees or furniture at the correct size and position give a readable scale.", "أشخاص أو أشجار أو أثاث بحجم وموضع صحيحين يعطون مقياساً مقروءاً."],
          ["Entourage is drawn in the same hand as the architecture, suggests use and never hides the design.", "العناصر المرافقة مرسومة بنفس يد العمارة، توحي بالاستعمال ولا تخفي التصميم أبداً."]]),
        crit("sheet", 10, "Composition of the sheet", "تكوين اللوحة", [
          ["The drawing is cramped in a corner or runs off the sheet.", "الرسم محشور في زاوية أو يخرج عن حدود اللوحة."],
          ["Centred, but without a clear focal point or framing.", "في الوسط، لكن بلا نقطة تركيز أو تأطير واضح."],
          ["Deliberate framing with a focal point, margins and a title.", "تأطير مقصود مع نقطة تركيز وهوامش وعنوان."],
          ["Foreground, middle ground and background are layered; the sheet reads as one designed composition.", "المقدّمة والوسط والخلفية متراكبة، واللوحة تُقرأ كتكوين واحد مصمَّم."]]),
      ],
    },
  });
  J.ORDER = ["comp", "bubble", "persp"];
  J.BENCH = { src: "GSD 1101", topic: "First-year architecture studio: form, organisation, representation", verified: false };

  /* ---------- pure scoring (no DOM, no AI) ---------- */
  const lang = () => (S5.i18n && S5.i18n.lang ? S5.i18n.lang() : "ar");
  const tx = (o) => (o ? o[lang()] || o.en || "" : "");
  const isLv = (l) => Number.isInteger(l) && l >= 1 && l <= 4;
  J.rubric = (id) => S5.RUBRICS[id] || null;
  /* weighted total: points = weight × level ÷ 4, so all-4 = 100 % and all-1 = 25 %; mean = weighted mean level */
  J.total = (R, scores) => {
    let sw = 0, swl = 0, n = 0;
    for (const c of R.criteria) { const l = scores && scores[c.id]; if (!isLv(l)) continue; sw += c.w; swl += c.w * l; n++; }
    if (!n) return null;
    return { mean: Math.round((swl * 100) / sw) / 100, pct: Math.round((swl * 10000) / (4 * sw)) / 100, n, of: R.criteria.length, partial: n < R.criteria.length };
  };
  J.complete = (R, scores) => R.criteria.every((c) => isLv(scores && scores[c.id]));
  /* the AI juror's reply is untrusted: unknown ids dropped, duplicates dropped, levels rounded and clamped to 1–4 */
  J.validate = (R, reply) => {
    const out = { ok: false, scores: {}, evidence: {}, questions: [], dropped: [], clamped: [], reason: "" };
    let o = reply;
    if (typeof o === "string") { try { o = JSON.parse(o); } catch { const m = /\{[\s\S]*\}/.exec(o); try { o = m ? JSON.parse(m[0]) : null; } catch { o = null; } } }
    if (!o || typeof o !== "object" || Array.isArray(o)) { out.reason = "not-object"; return out; }
    if (!Array.isArray(o.criteria)) { out.reason = "no-criteria"; return out; }
    const ids = new Set(R.criteria.map((c) => c.id));
    for (const c of o.criteria.slice(0, 40)) {
      const id = c && typeof c === "object" && c.id != null ? String(c.id).trim().toLowerCase() : "";
      if (!id || !ids.has(id)) { out.dropped.push(id ? id.slice(0, 40) : "?"); continue; }
      if (id in out.scores) { out.dropped.push(id + " (repeat)"); continue; }
      const raw = Number(c.level); if (!Number.isFinite(raw)) { out.dropped.push(id + " (no level)"); continue; }
      const lv = S5.clamp(Math.round(raw), 1, 4); if (lv !== raw) out.clamped.push({ id, from: raw, to: lv });
      out.scores[id] = lv; out.evidence[id] = typeof c.evidence === "string" ? c.evidence.trim().slice(0, 400) : "";
    }
    out.questions = (Array.isArray(o.questions) ? o.questions : []).filter((q) => typeof q === "string" && q.trim()).slice(0, 5).map((q) => q.trim().slice(0, 300));
    out.ok = Object.keys(out.scores).length > 0; if (!out.ok) out.reason = "no-valid-criteria";
    return out;
  };
  /* calibration: per-criterion and total deltas between the three columns (null where a column is missing) */
  J.deltas = (R, rec) => {
    const s = rec.self || {}, a = (rec.ai && rec.ai.scores) || {}, p = rec.prof || {};
    const d = (x, y) => (isLv(x) && isLv(y) ? x - y : null);
    const per = {}; for (const c of R.criteria) per[c.id] = { aiSelf: d(a[c.id], s[c.id]), profSelf: d(p[c.id], s[c.id]), profAi: d(p[c.id], a[c.id]) };
    const T = J.totals(R, rec), dt = (x, y) => (x != null && y != null ? Math.round((x - y) * 100) / 100 : null);
    return { crit: per, total: { aiSelf: dt(T.ai, T.self), profSelf: dt(T.prof, T.self), profAi: dt(T.prof, T.ai) } };
  };
  J.totals = (R, rec) => { const t = (sc) => { const x = J.total(R, sc); return x ? x.pct : null; }; return { self: t(rec.self), ai: t(rec.ai && rec.ai.scores), prof: t(rec.prof) }; };
  const mean = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
  /* bias = mean signed gap in levels: self − professor (over-rating > 0) and AI − professor */
  J.bias = (recs) => {
    const sp = [], ap = [];
    for (const rec of recs) { const R = J.rubric(rec.rubric); if (!R) continue; const dl = J.deltas(R, rec).crit; for (const id in dl) { if (dl[id].profSelf != null) sp.push(-dl[id].profSelf); if (dl[id].profAi != null) ap.push(-dl[id].profAi); } }
    return { selfVsProf: mean(sp), aiVsProf: mean(ap), nSelf: sp.length, nAi: ap.length, absSelf: mean(sp.map(Math.abs)), absAi: mean(ap.map(Math.abs)) };
  };
  J.selfLocked = (rec) => !!(rec.ai && rec.ai.ok) || !!rec.profAt || Object.values(rec.prof || {}).some(isLv); // once a professor score was entered the lock stays, even if it is cleared later
  J.boardLocked = J.selfLocked;
  J.usedToday = () => { const t = S5.todayISO(); return S5.ai.log().filter((l) => l.purpose === J.PURPOSE && (l.at || "").slice(0, 10) === t).length; };
  const err = (code, message) => ({ code, message });
  /* what still blocks the AI juror (null = ready). Self-scores come first so the student commits before any reading. */
  J.gate = (rec) => {
    const R = J.rubric(rec.rubric); if (!R) return err("rubric", "This pin-up uses a rubric this version does not know.");
    if (!rec.boardKey) return err("no-board", "Pin up a board first.");
    if (!(rec.intent || "").trim()) return err("no-intent", "Write your intent statement first.");
    if (!J.complete(R, rec.self)) return err("self-first", "Score yourself on every criterion first.");
    if (J.usedToday() >= J.BUDGET) return err("budget", "Today's AI juror budget is used up. Your professor's scores and the calibration still work.");
    if (!S5.ai.on()) return err("ai-off", S5.ai.state === "none" ? "AI is not available in this view." : "AI is turned off in Settings.");
    return null;
  };
  /* the juror's brief. It does not see the self-scores, so its reading stays independent of them. */
  J.prompt = (R, rec) => {
    const ar = S5.hasArabic(rec.intent) || (!/[A-Za-z]/.test(rec.intent || "") && lang() === "ar");
    const rows = R.criteria.map((c) => `- id "${c.id}" — ${c.en} (weight ${c.w}%): ${c.lv.map((l, i) => `${i + 1} = ${l.en}`).join(" ")}`).join("\n");
    return `You are a visiting juror at a first-year architecture studio pin-up (Northern Technical University, Iraq). Read the attached board against the rubric. Your reading is advice for the student, not a grade: the professor and the real jury decide.
Project: ${R.en}. Brief: ${R.brief.en}
The student's intent statement (their own words): """${(rec.intent || "").slice(0, 1200)}"""
Rubric — for each criterion choose ONE level from 1 to 4 using its descriptors:
${rows}
Rules: judge only what is visible on the board; if something cannot be seen, choose the lower level and say so. Evidence is one short sentence that points to where on the board. Then ask 2 or 3 open questions a juror would ask at the pin-up (about the intent, the decisions, the next step). Do not compute totals. Write evidence and questions in ${ar ? "Arabic (Modern Standard, Iraqi-friendly, technical terms in English in parentheses)" : "English"}.
Reply with only JSON: {"criteria":[{"id":"${R.criteria[0].id}","level":3,"evidence":"..."}],"questions":["..."]}`;
  };

  /* ---------- records ---------- */
  const recompute = (R, rec) => ({ total: J.totals(R, rec), deltas: J.deltas(R, rec) });
  J.save = async (id, patch) => {
    const cur = S5.store.get(id); if (!cur) return null; const R = J.rubric(cur.rubric);
    const next = { ...cur, ...patch }; return S5.store.update(id, R ? { ...patch, ...recompute(R, next) } : patch);
  };
  J.create = async (rubricId, fields = {}) => {
    const R = J.rubric(rubricId); if (!R) throw err("rubric", "Unknown rubric.");
    return S5.store.create("jury", { rubric: R.id, rubricV: R.v, title: "Jury · " + R.en, projectId: "", boardKey: "", intent: "", self: {}, ai: null, aiStatus: null, prof: {}, profVerbatim: "", total: { self: null, ai: null, prof: null }, deltas: null, tiers: { ...J.TIER }, ...fields });
  };
  J.setSelf = async (id, cid, lv) => {
    const rec = S5.store.get(id); const R = rec && J.rubric(rec.rubric); if (!R || !R.criteria.some((c) => c.id === cid) || !isLv(lv)) return null;
    if (J.selfLocked(rec)) throw err("locked", "Self-scores are locked once a jury reading exists, so the calibration stays honest.");
    return J.save(id, { self: { ...(rec.self || {}), [cid]: lv }, selfAt: S5.now() });
  };
  J.setProf = async (id, cid, lv) => {
    const rec = S5.store.get(id); const R = rec && J.rubric(rec.rubric); if (!R || !R.criteria.some((c) => c.id === cid)) return null;
    if (!J.complete(R, rec.self)) throw err("self-first", "Score yourself on every criterion first.");
    const prof = { ...(rec.prof || {}) }; if (isLv(lv)) prof[cid] = lv; else delete prof[cid];
    return J.save(id, { prof, profAt: rec.profAt || S5.now() });
  };

  /* ---------- the board: photo or ink page → ≤1280 px JPEG 0.85 in the blob store ---------- */
  J.downscale = async (src) => {
    let img = src, close = null;
    if (!(src instanceof HTMLCanvasElement)) {
      if (window.createImageBitmap) { img = await createImageBitmap(src); close = () => img.close && img.close(); }
      else img = await new Promise((res, rej) => { const u = URL.createObjectURL(src), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => { URL.revokeObjectURL(u); rej(err("image", "This image could not be read.")); }; i.src = u; });
    }
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height; if (!w || !h) throw err("image", "This image could not be read.");
    const k = Math.min(1, J.MAXPX / Math.max(w, h)), W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
    const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H); if (close) close();
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", J.QUALITY)); if (!blob) throw err("image", "The board could not be converted.");
    return { blob, w: W, h: H };
  };
  /* an ink page drawn without opening an editor (the engine's own painter, no DOM stage) */
  J.inkCanvas = (p) => {
    const W = p.width || 1000, H = p.height || 1414, s = J.MAXPX / Math.max(W, H);
    const layers = p.layers && p.layers.length ? p.layers : [{ v: true }];
    return S5.Ink.prototype.toCanvas.call({ W, H, doc: p, strokes: p.strokes || [], layers, paint: S5.Ink.prototype.paint }, s);
  };
  J.pin = async (id, src, extra = {}) => {
    const rec = S5.store.get(id); if (!rec) return null; if (J.boardLocked(rec)) throw err("locked", "The board is locked once a jury reading exists. Start a new pin-up for a new version.");
    const { blob, w, h } = await J.downscale(src); const info = await S5.blobs.put(blob);
    return J.save(id, { boardKey: info.key, boardW: w, boardH: h, boardBytes: info.size, boardAt: S5.now(), boardSrc: "photo", inkId: "", ...extra });
  };
  J.pinInk = async (id, inkId) => { const p = S5.store.get(inkId); if (!p) throw err("ink", "That ink page is gone."); return J.pin(id, J.inkCanvas(p), { boardSrc: "ink", inkId }); };

  /* ---------- the AI juror (governed path S5.ai.ask: switch, noAI flag, daily caps, aiLog) ---------- */
  J.receive = async (id, reply, failure) => {
    const rec = S5.store.get(id); const R = rec && J.rubric(rec.rubric); if (!R) return null;
    const at = S5.now();
    if (failure) { await J.save(id, { aiStatus: { ok: false, at, code: failure.code || "error", reason: failure.message || "AI request failed." } }); return null; }
    const v = J.validate(R, reply);
    if (!v.ok) { await J.save(id, { aiStatus: { ok: false, at, code: v.reason, reason: "The juror's reply did not contain rubric scores." } }); return null; }
    const ai = { ok: true, at, tier: J.TIER.ai, scores: v.scores, evidence: v.evidence, questions: v.questions, dropped: v.dropped, clamped: v.clamped };
    await J.save(id, { ai, aiStatus: { ok: true, at, partial: Object.keys(v.scores).length < R.criteria.length } });
    return ai;
  };
  J.busy = null;
  J.askAI = async (id) => {
    const rec = S5.store.get(id); if (!rec) throw err("missing", "This pin-up no longer exists.");
    const g = J.gate(rec); if (g) throw g;
    if (J.busy) throw err("busy", "The juror is already reading a board.");
    J.busy = id;
    try {
      const b = await S5.blobs.get(rec.boardKey); if (!b) throw err("no-board", "The board image is missing on this device. Pin it up again.");
      const R = J.rubric(rec.rubric); let reply, failure = null;
      try { reply = await S5.ai.ask(J.PURPOSE, J.prompt(R, rec), { json: true, temperature: 0.2, max_tokens: 900, images: [new Blob([b.data], { type: b.mime })], records: [rec] }); }
      catch (e) { failure = e || err("error", "AI request failed."); }
      return await J.receive(id, reply, failure);
    } finally { J.busy = null; }
  };

  /* ---------- view ---------- */
  const H = S5.h;
  const pct = (x) => (x == null ? "—" : S5.round(x, 1) + "%");
  const sgn = (x) => (x == null ? "—" : x > 0 ? "+" + x : String(x));
  const tier = (k) => (S5.TIERS && S5.TIERS[J.TIER[k]] && S5.TIERS[J.TIER[k]].label) || J.TIER[k];
  const lvName = (n) => tx(J.LEVELS[n - 1]);
  const css = () => {
    if (document.getElementById("jy-css")) return;
    const st = document.createElement("style"); st.id = "jy-css";
    st.textContent = `.jy-crit{border-top:1px solid var(--rule);padding:10px 0}.jy-crit:first-of-type{border-top:0}.jy-crit-h{display:flex;gap:8px;align-items:baseline;justify-content:space-between;margin-bottom:6px}
.jy-levels{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.jy-lv{text-align:start;border:1px solid var(--rule);border-radius:var(--r);background:var(--paper);color:var(--ink);padding:8px;font-size:.8rem;line-height:1.35;cursor:pointer;display:grid;gap:4px;align-content:start}
.jy-lv b{font-size:.74rem}.jy-lv[aria-pressed="true"]{border-color:var(--cobalt);background:var(--cobalt-wash);box-shadow:inset 0 0 0 1px var(--cobalt)}.jy-lv:disabled{cursor:default;opacity:.62}.jy-lv[aria-pressed="true"]:disabled{opacity:1}
[id^="jy-"] .tbl th,#jy-ai .ai-label{letter-spacing:0}.jy-board{display:block;max-width:100%;max-height:420px;margin:0 auto;border:1px solid var(--rule);border-radius:4px;background:#fff}.jy-gap{font-weight:700}.jy-gap.big{color:var(--redline)}
@media (max-width:760px){.jy-levels{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:420px){.jy-levels{grid-template-columns:1fr}}`;
    document.head.appendChild(st);
  };
  const crumbs = `<div class="crumbs"><button data-act="open" data-v="practice">Practice</button><button data-act="open" data-v="jury">Jury room</button></div>`;
  const honest = `<p class="small muted">This room is practice. It cannot grant a grade — the professor's mark and the real jury decide.</p>`;

  const home = () => {
    const recs = S5.store.list("jury").sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    const cards = J.ORDER.map((k) => S5.RUBRICS[k]).filter(Boolean).map((R) => `<section class="sheet"><span class="eyebrow">Rubric</span><h3 data-noi18n dir="auto">${esc(tx(R))}</h3>
      <p class="small" data-noi18n dir="auto">${esc(tx(R.brief))}</p>
      <p class="tiny muted"><span>Criteria</span> ${R.criteria.length} · <span>4 levels</span></p>
      <div class="row">${H.btn("Start a pin-up", "jury-new", { rubric: R.id }, "primary")}</div></section>`).join("");
    const b = J.bias(recs);
    const list = recs.length ? `<div class="list">${recs.slice(0, 30).map((r) => { const R = J.rubric(r.rubric), t = r.total || {};
      return H.item({ lead: r.prof && Object.keys(r.prof).length ? "green" : r.ai ? "amber" : "cobalt", t: `<span data-noi18n>${esc(R ? tx(R) : r.rubric)}</span>`, s: `${esc(S5.fmtDateTime(r.createdAt))} · <span>Self</span> ${pct(t.self)} · <span>AI</span> ${pct(t.ai)} · <span>Professor</span> ${pct(t.prof)}`, act: "open", data: { v: "jury", id: r.id } }); }).join("")}</div>`
      : H.empty("No pin-ups yet", "Pick a rubric above and pin up your first board.");
    const cal = b.nSelf || b.nAi ? `<div class="grid cols-2"><div class="stat"><span class="v">${b.selfVsProf == null ? "—" : sgn(b.selfVsProf)}</span><span class="l">Self − professor, mean levels (over-rating is +)</span></div><div class="stat"><span class="v">${b.aiVsProf == null ? "—" : sgn(b.aiVsProf)}</span><span class="l">AI − professor, mean levels</span></div></div><p class="tiny muted"><span>Compared criteria</span> ${b.nSelf}</p>`
      : `<p class="small muted">Calibration appears after you type your professor's scores for a pin-up.</p>`;
    return `${crumbs}<div class="page-head"><div class="titles"><span class="eyebrow">Studio · year 1 architecture</span><h1>Jury room</h1><p class="small">Pin up your work like a real studio review: state your intent, score yourself first, hear an AI juror's reading (advice only), then type in the professor's scores and compare.</p>${honest}</div></div>
      <div id="jy-home"><div class="grid cols-3">${cards}</div>
      <p class="tiny muted" style="margin:8px 0 16px"><span>Vocabulary aligned with a first-year design studio (Harvard GSD 1101 topics) — topics only, nothing copied.</span> <span class="pill amber">unverified</span></p>
      ${H.section("Your pin-ups", list)}${H.section("Calibration across pin-ups", cal)}</div>`;
  };

  const secBoard = (rec, R) => {
    const locked = J.boardLocked(rec), projects = S5.store.list("project");
    const img = rec.boardKey ? `<img class="jy-board" id="jy-board-img" data-jy-blob="${esc(rec.boardKey)}" alt="Pinned board">` : `<div class="dropzone">No board pinned yet.</div>`;
    return `<section class="sheet" id="jy-board"><header><h3>1 · Pin up the board</h3><div class="row">${rec.boardKey ? H.pill(rec.boardSrc === "ink" ? "ink page" : "photo") : ""}</div></header>
      ${img}${rec.boardKey ? `<p class="tiny muted" data-noi18n>${rec.boardW}×${rec.boardH} px · JPEG ${J.QUALITY}</p>` : ""}
      ${locked ? `<p class="small muted">The board and intent are locked after the jury reading — start a new pin-up for a new version.</p>` : `<div class="row" style="margin:8px 0"><label class="btn primary">Photo of the board<input id="jy-file" type="file" accept="image/*" hidden></label>${H.btn("Use an ink page", "jury-ink", { id: rec.id })}</div>`}
      <label class="field"><span>Intent statement — what should the jury see?</span><textarea id="jy-intent" dir="auto" rows="3" ${locked ? "readonly" : ""}>${esc(rec.intent || "")}</textarea></label>
      ${projects.length ? `<label class="field" style="margin-top:8px"><span>Design project (optional)</span><select id="jy-project" data-noi18n ${locked ? "disabled" : ""}><option value="">—</option>${projects.map((p) => `<option value="${esc(p.id)}" ${p.id === rec.projectId ? "selected" : ""}>${esc(p.name || p.title || p.id)}</option>`).join("")}</select></label>` : ""}</section>`;
  };
  const secBrief = (R) => `<section class="sheet" id="jy-brief"><header><h3>The brief</h3><span class="pill amber">unverified</span></header>
    <p class="small" data-noi18n dir="auto">${esc(tx(R.brief))}</p>
    <table class="tbl"><thead><tr><th>Criterion</th><th class="num">Weight</th></tr></thead><tbody>${R.criteria.map((c) => `<tr><td data-noi18n dir="auto">${esc(tx(c))}</td><td class="num">${c.w}%</td></tr>`).join("")}</tbody></table>
    <p class="tiny muted">Weighted total = Σ weight × level ÷ 4 (all level 4 = 100%). Computed by the app, never by the AI.</p></section>`;
  const secSelf = (rec, R) => {
    const locked = J.selfLocked(rec), s = rec.self || {}, t = J.total(R, s), done = J.complete(R, s);
    const rows = R.criteria.map((c) => `<div class="jy-crit" data-crit="${c.id}"><div class="jy-crit-h"><strong data-noi18n dir="auto">${esc(tx(c))}</strong><span class="pill">${c.w}%</span></div>
      <div class="jy-levels" role="radiogroup">${c.lv.map((d, i) => `<button class="jy-lv" data-act="jury-self" data-id="${rec.id}" data-crit="${c.id}" data-lv="${i + 1}" aria-pressed="${s[c.id] === i + 1}" ${locked ? "disabled" : ""} data-noi18n dir="auto"><b>${i + 1} · ${esc(lvName(i + 1))}</b><span>${esc(tx(d))}</span></button>`).join("")}</div></div>`).join("");
    return `<section class="sheet" id="jy-self"><header><h3>2 · Score yourself first</h3><div class="row"><span class="pill">${esc(tier("self"))} · self-assessment</span></div></header>
      <p class="small muted">${locked ? "Self-scores are locked once a jury reading exists, so the calibration stays honest." : "Commit to your own reading before anyone else's. The AI juror stays closed until every criterion has your score."}</p>
      ${rows}<p class="small" id="jy-self-total"><span>Your weighted total</span>: <strong>${t ? pct(t.pct) : "—"}</strong> ${done ? "" : `<span class="pill amber">${Object.values(s).filter(isLv).length}/${R.criteria.length}</span>`}</p></section>`;
  };
  const secAI = (rec, R) => {
    const g = J.gate(rec), st = rec.aiStatus, ai = rec.ai, t = ai ? J.total(R, ai.scores) : null, n = J.usedToday();
    const status = st && !st.ok ? `<div class="sheet alert" data-status="unavailable" style="margin:8px 0"><strong>Juror unavailable</strong><p class="small" dir="auto">${esc(st.reason || "")}</p></div>` : "";
    const reading = ai ? `<div data-status="ok"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Criterion</th><th class="num">Level</th><th>Evidence</th></tr></thead><tbody>${R.criteria.map((c) => `<tr><td data-noi18n dir="auto">${esc(tx(c))}</td><td class="num">${ai.scores[c.id] || "—"}</td><td data-uc dir="auto">${esc((ai.evidence || {})[c.id] || "")}</td></tr>`).join("")}</tbody></table></div>
      <p class="small"><span>AI weighted total</span>: <strong id="jy-ai-total">${t ? pct(t.pct) : "—"}</strong> ${t && t.partial ? `<span class="pill amber">partial</span>` : ""} <span class="ai-label">AI reading, not a grade</span></p>
      ${(ai.dropped || []).length || (ai.clamped || []).length ? `<p class="tiny muted"><span>Checked by the app</span>: <span data-noi18n>${esc([...(ai.dropped || []).map((d) => "✗ " + d), ...(ai.clamped || []).map((c) => `${c.id} ${c.from}→${c.to}`)].join(" · "))}</span></p>` : ""}
      ${(ai.questions || []).length ? `<p class="small"><strong>The juror asks</strong></p><ol class="ai-out" dir="auto">${ai.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>` : ""}</div>` : "";
    const why = g && g.code !== "ai-off" ? `<p class="small" style="color:var(--amber)" id="jy-gate" data-code="${g.code}">${esc(g.message)}</p>` : g ? `<p class="small muted" id="jy-gate" data-code="${g.code}">${esc(g.message)}</p>` : "";
    return `<section class="sheet" id="jy-ai"><header><h3>3 · AI juror</h3><div class="row"><span class="pill amber">${esc(tier("ai"))} · AI opinion · verify</span></div></header>
      <p class="small muted">The AI reads the board against the rubric and asks questions. Its levels are advice only: they never change a grade or your mastery.</p>
      ${why}<div class="row" style="margin:6px 0"><button class="btn primary" id="jy-ask" data-act="jury-ai" data-id="${rec.id}" ${g || J.busy ? "disabled" : ""}>${ai ? "Ask the AI juror again" : "Ask the AI juror"}</button><span class="tiny muted"><span>Jury requests today</span> ${n} / ${J.BUDGET}</span></div>
      <div id="jy-ai-busy" class="small muted" ${J.busy === rec.id ? "" : "hidden"}>The juror is reading the board…</div>${status}${reading}</section>`;
  };
  const secProf = (rec, R) => {
    const open = J.complete(R, rec.self), p = rec.prof || {}, t = J.total(R, p);
    return `<section class="sheet" id="jy-prof"><header><h3>4 · Professor / jury scores</h3><div class="row"><span class="pill green">${esc(tier("prof"))} · authoritative</span></div></header>
      <p class="small muted">${open ? "Type exactly what the professor or the jury gave. For studio work these scores are the authority." : "Score yourself first — then type the professor's scores here."}</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Criterion</th><th class="num">Weight</th><th>Level</th></tr></thead><tbody>${R.criteria.map((c) => `<tr><td data-noi18n dir="auto">${esc(tx(c))}</td><td class="num">${c.w}%</td><td><select data-jy-prof="${c.id}" ${open ? "" : "disabled"} aria-label="Professor level"><option value="">—</option>${[1, 2, 3, 4].map((n) => `<option value="${n}" ${p[c.id] === n ? "selected" : ""}>${n}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>
      <p class="small" id="jy-prof-total"><span>Professor's weighted total</span>: <strong>${t ? pct(t.pct) : "—"}</strong></p>
      <label class="field"><span>The professor's words, verbatim</span><textarea id="jy-verbatim" dir="auto" rows="3" ${open ? "" : "readonly"}>${esc(rec.profVerbatim || "")}</textarea></label></section>`;
  };
  const secCalib = (rec, R) => {
    const T = J.totals(R, rec), D = J.deltas(R, rec), s = rec.self || {}, a = (rec.ai && rec.ai.scores) || {}, p = rec.prof || {};
    const cell = (x) => `<td class="num">${isLv(x) ? x : "—"}</td>`, gap = (x) => `<td class="num"><span class="jy-gap ${x != null && Math.abs(x) >= 2 ? "big" : ""}">${sgn(x)}</span></td>`;
    const rows = R.criteria.map((c) => `<tr data-crit="${c.id}"><td data-noi18n dir="auto">${esc(tx(c))}</td><td class="num">${c.w}%</td>${cell(s[c.id])}${cell(a[c.id])}${cell(p[c.id])}${gap(D.crit[c.id].aiSelf)}${gap(D.crit[c.id].profSelf)}${gap(D.crit[c.id].profAi)}</tr>`).join("");
    const b = J.bias([rec]); let note = "";
    if (b.nSelf) { const big = R.criteria.map((c) => [c, D.crit[c.id].profSelf]).filter(([, x]) => x != null).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))[0];
      note = `<p class="small">${b.selfVsProf > 0 ? `You rated yourself ${b.selfVsProf} levels above the professor on average.` : b.selfVsProf < 0 ? `You rated yourself ${-b.selfVsProf} levels below the professor on average.` : "Your self-scores match the professor's on average."}</p>${big && big[1] ? `<p class="small"><span>Largest gap</span>: <strong data-noi18n dir="auto">${esc(tx(big[0]))}</strong></p>` : ""}`; }
    else note = `<p class="small muted">Type the professor's scores to see how well your self-assessment is calibrated.</p>`;
    return `<section class="sheet" id="jy-calib"><header><h3>Calibration</h3></header><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Criterion</th><th class="num">Weight</th><th class="num">Self</th><th class="num">AI</th><th class="num">Professor</th><th class="num">AI − self</th><th class="num">Prof − self</th><th class="num">Prof − AI</th></tr></thead>
      <tbody>${rows}</tbody><tfoot><tr><th>Weighted total</th><td></td><td class="num" id="jy-t-self">${pct(T.self)}</td><td class="num" id="jy-t-ai">${pct(T.ai)}</td><td class="num" id="jy-t-prof">${pct(T.prof)}</td><td class="num">${sgn(D.total.aiSelf)}</td><td class="num">${sgn(D.total.profSelf)}</td><td class="num">${sgn(D.total.profAi)}</td></tr></tfoot></table></div>${note}
      <p class="tiny muted">Levels 1–4; a gap of 2 or more levels is marked. Only the professor's column counts as evidence for studio work (EP).</p></section>`;
  };
  const SECTIONS = { board: secBoard, self: secSelf, ai: secAI, prof: secProf, calib: secCalib };
  /* refresh only the given sections in place (a live view: typed text elsewhere is never wiped) */
  J.refresh = (id, keys = ["board", "self", "ai", "prof", "calib"]) => {
    const rec = S5.store.get(id); const R = rec && J.rubric(rec.rubric); if (!R || S5.ui.route.v !== "jury" || S5.ui.route.id !== id) return;
    for (const k of keys) { const el = document.getElementById("jy-" + k); if (el) el.outerHTML = SECTIONS[k](rec, R); }
    if (keys.includes("board")) loadBoard();
  };
  const loadBoard = async () => {
    const img = document.getElementById("jy-board-img"); if (!img || img.src) return;
    const u = await S5.blobs.url(img.dataset.jyBlob); if (!u) return; img.src = u; img.onload = () => URL.revokeObjectURL(u);
  };

  S5.views.jury = (r) => {
    css();
    if (!r.id) return home();
    const rec = S5.store.get(r.id);
    if (!rec || rec.type !== "jury") return `${crumbs}${H.empty("This pin-up is not on this device", "It may have been deleted. Start a new one from the Jury room.", H.btn("Jury room", "open", { v: "jury" }, "primary"))}`;
    const R = J.rubric(rec.rubric);
    if (!R) return `${crumbs}${H.empty("Unknown rubric", "This pin-up was made with a rubric this version does not have. Its data is kept unchanged.")}`;
    if (S5.setPlace) S5.setPlace("Jury room", { v: "jury", id: rec.id });
    S5.ui.mount(() => {
      loadBoard();
      const view = document.getElementById("view");
      const saveText = S5.debounce((k, v) => J.save(rec.id, { [k]: v }), 400);
      const onInput = (e) => { const t = e.target; if (t.id === "jy-intent") saveText("intent", t.value); else if (t.id === "jy-verbatim") saveText("profVerbatim", t.value); };
      const onChange = async (e) => {
        const t = e.target;
        try {
          if (t.id === "jy-file" && t.files && t.files[0]) { S5.ui.toast("Pinning up the board…"); await J.pin(rec.id, t.files[0]); J.refresh(rec.id, ["board", "ai"]); }
          else if (t.id === "jy-intent") { await J.save(rec.id, { intent: t.value }); J.refresh(rec.id, ["ai"]); }
          else if (t.id === "jy-verbatim") await J.save(rec.id, { profVerbatim: t.value });
          else if (t.id === "jy-project") await J.save(rec.id, { projectId: t.value });
          else if (t.dataset.jyProf) { await J.setProf(rec.id, t.dataset.jyProf, t.value ? +t.value : null); J.refresh(rec.id, ["self", "prof", "calib", "board"]); }
        } catch (x) { S5.ui.toast(x.message || "Something went wrong", true); }
      };
      view.addEventListener("input", onInput); view.addEventListener("change", onChange);
      return () => { view.removeEventListener("input", onInput); view.removeEventListener("change", onChange); };
    });
    return `${crumbs}<div class="page-head"><div class="titles"><span class="eyebrow">Studio jury · practice pin-up</span><h1 data-noi18n dir="auto">${esc(tx(R))}</h1>${honest}</div>
      <div class="row">${H.btn("Delete pin-up", "jury-del", { id: rec.id })}</div></div>
      <div class="grid cols-2">${secBoard(rec, R)}${secBrief(R)}</div>${secSelf(rec, R)}${secAI(rec, R)}${secProf(rec, R)}${secCalib(rec, R)}`;
  };

  /* ---------- actions ---------- */
  S5.act["jury-new"] = async (el) => { const rec = await J.create(el.dataset.rubric); S5.ui.go({ v: "jury", id: rec.id }); };
  S5.act["jury-self"] = async (el) => { await J.setSelf(el.dataset.id, el.dataset.crit, +el.dataset.lv); J.refresh(el.dataset.id, ["self", "ai", "prof", "calib"]); };
  S5.act["jury-ai"] = async (el) => {
    const id = el.dataset.id; const rec = S5.store.get(id); if (!rec) return;
    const g = J.gate(rec); if (g) { S5.ui.toast(g.message, true); J.refresh(id, ["ai"]); return; }
    const p = J.askAI(id); J.refresh(id, ["ai"]);
    try { const ai = await p; if (!ai) S5.ui.toast("Juror unavailable", true); }
    catch (e) { S5.ui.toast(e.message || "Juror unavailable", true); }
    J.refresh(id, ["board", "self", "ai", "prof", "calib"]);
  };
  S5.act["jury-ink"] = (el) => {
    const id = el.dataset.id;
    // drawings only: PDF markup pages (fileId) hold notes over a document, not a board
    const pages = S5.store.list("inkpage", (p) => !p.fileId && (p.strokes || []).length).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 20);
    const m = S5.ui.modal("Use an ink page", pages.length ? `<div class="list">${pages.map((p) => H.item({ lead: "cobalt", t: esc(p.title || "Ink page"), s: esc(S5.fmtDateTime(p.updatedAt || p.createdAt)), act: "jury-ink-pick", data: { id, ink: p.id } })).join("")}</div>` : H.empty("No ink pages with drawing yet", "Draw in a notebook, the Studio or the Drawing Coach first, or pin up a photo."));
    S5.jury.modal = m;
  };
  S5.act["jury-ink-pick"] = async (el) => {
    try { await J.pinInk(el.dataset.id, el.dataset.ink); if (J.modal) J.modal.close(); J.modal = null; J.refresh(el.dataset.id, ["board", "ai"]); }
    catch (e) { S5.ui.toast(e.message || "Something went wrong", true); }
  };
  S5.act["jury-del"] = (el) => S5.ui.confirm("Delete this pin-up? It goes to the Trash and can be restored.", "Delete", async () => { await S5.store.remove(el.dataset.id); S5.ui.go({ v: "jury" }, true); }, true);

  /* search results and labels know the new record type (no shared file edited) */
  const openPrev = S5.openRecord; S5.openRecord = (r, page) => (r && r.type === "jury" ? S5.ui.go({ v: "jury", id: r.id }) : openPrev(r, page));
  const labelPrev = S5.typeLabel; S5.typeLabel = (t) => (t === "jury" ? "Jury pin-up" : labelPrev(t));

  /* registration through the college hooks */
  S5.CAMPUS_EXTRA = S5.CAMPUS_EXTRA || []; S5.CAMPUS_EXTRA.push(["studio", ["Jury room", { v: "jury" }]]);
  S5.LIVE_EXTRA = S5.LIVE_EXTRA || []; S5.LIVE_EXTRA.push("jury");
  S5.ROOT_EXTRA = Object.assign(S5.ROOT_EXTRA || {}, { jury: "practice" });
})();

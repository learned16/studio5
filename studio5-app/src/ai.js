/* AI Orchestrator. AI explains, tests and suggests; it never becomes a trusted source by itself and never
   produces graded work for the student. Every request is logged (what was sent, why), respects the
   per-record "no AI" flag, a daily request cap, and the global switch. Studio5 works fully without AI. */
S5.ai = {
  fn: null, state: "checking",
  async init() {
    if (S5.standalone) { // installed app: the same AI features run on your Cloudflare account (Workers AI), no Claude tokens
      const toUrl = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
      const parts = async (input, images) => (images && images.length ? [{ type: "text", text: input }, ...(await Promise.all(images.map(toUrl))).map((url) => ({ type: "image_url", image_url: { url } }))] : input);
      const run = async (input, opts = {}) => { // images (drawings, screenshots) go to the vision model as data URLs
        return { text: await S5.tutor.ask([{ role: "user", content: await parts(input, opts.images) }], { onText: opts.onText, temperature: opts.temperature, max_tokens: opts.max_tokens }) };
      };
      run.json = async (input, opts = {}) => S5.tutor.ask([{ role: "user", content: await parts(input + "\n\nReturn only valid JSON.", opts.images) }], { json: true, temperature: opts.temperature, max_tokens: opts.max_tokens });
      this.fn = run; this.state = "ready"; S5.bus.emit("ai", this.state); return;
    }
    if (!window.claude || typeof window.claude.use !== "function") { this.state = "none"; return; }
    try { this.fn = await window.claude.use("sample"); this.state = this.fn ? "ready" : "none"; } catch { this.state = "none"; }
    S5.bus.emit("ai", this.state);
  },
  on() { return this.state === "ready" && S5.settings.get("aiEnabled"); },
  log() { return S5.store.meta.aiLog || []; },
  usedToday() { const t = S5.todayISO(); return this.log().filter((l) => l.at.slice(0, 10) === t).length; },
  RULES: `You are the study assistant inside Studio5, a private study system for an architecture & building technology student (Northern Technical University, Iraq). Rules:
- Explain, coach, quiz and suggest. Never write graded work (reports, designs, exam answers) for the student to submit as their own.
- Separate clearly: what the source/professor said, what you infer. Mark uncertainty plainly.
- Engineering, structural, site and safety topics are for learning only, not for design approval or execution.
- Answer in the language of the student's text (Arabic or English). If the student wrote Arabic, answer in clear Modern Standard Arabic with Iraqi-friendly wording and keep technical English terms in parentheses.
- Be concise and concrete. No filler.`,
  async ask(purpose, prompt, { json = false, tier = "default", onText, records = [], images, signal, temperature, max_tokens } = {}) {
    if (!this.on()) throw { code: "off", message: S5.ai.state === "none" ? "AI is not available in this view." : "AI is turned off in Settings." };
    const blocked = records.filter((r) => r && r.noAI);
    if (blocked.length) throw { code: "blocked", message: `“${S5.title(blocked[0])}” is marked “no AI”. Remove that flag to use AI on it.` };
    if (this.usedToday() >= S5.settings.get("aiDailyCap")) throw { code: "cap", message: "Today's AI request limit is reached. Change it in Settings → AI." };
    const input = this.RULES + "\n\n" + prompt;
    const entry = { at: S5.now(), purpose, chars: input.length, records: records.filter(Boolean).map((r) => r.id), images: images ? images.length : 0, ok: false };
    const log = [entry, ...this.log()].slice(0, 300); S5.store.meta.aiLog = log; S5.idb.put("meta", "aiLog", log);
    const opts = { modelTier: tier }; if (onText) opts.onText = onText; if (images) opts.images = images; if (signal) opts.signal = signal;
    if (typeof temperature === "number") opts.temperature = temperature; if (max_tokens) opts.max_tokens = max_tokens; // the Worker clamps both
    try {
      const res = json ? await this.fn.json(input, opts) : await this.fn(input, opts);
      entry.ok = true; S5.idb.put("meta", "aiLog", log);
      return json ? res : res.text;
    } catch (e) {
      entry.err = e?.code || "error"; S5.idb.put("meta", "aiLog", log);
      const msg = { not_granted: "You declined AI for this page. Allow it from the page's Permissions menu to use AI features.", rate_limited: "AI is busy right now. Try again in a minute.", invalid_json: "The AI reply could not be read as structured data. Try again with less text." }[e?.code];
      throw { code: e?.code || "error", message: msg || e?.message || "AI request failed." };
    }
  },
  ctxSubject(id) { const s = S5.store.get(id); return s ? `Subject: ${s.name} (${s.ar}), year ${s.year}, semester ${s.semester}.` : ""; },
  METHODS: { simple: "Explain it simply, like to a smart first-year student, in 5–8 short lines.", visual: "Explain it visually: describe a sketch or diagram the student can draw step by step, with labels.", practical: "Explain with a practical example from building sites or architecture studio work in Iraq.", technical: "Give a precise technical explanation with definitions and the governing formula or rule.", architectural: "Explain through an architectural design example (plans, sections, spaces).", fromStart: "Start from the prerequisite ideas and build up to this concept step by step." },
  explainGap(gap, method, onText) {
    const ctx = [this.ctxSubject(gap.subjectId), gap.context ? "Context: " + gap.context : "", gap.page ? `Source page: ${gap.page}` : ""].filter(Boolean).join("\n");
    const past = (gap.attempts || []).map((a, i) => `Attempt ${i + 1} used method "${a.method}" — student result: ${a.result}`).join("\n");
    return this.ask("Understanding rescue", `${ctx}\nThe student does not understand: "${gap.text}"\nDiagnosed problem type: ${gap.gapType || "unknown"}.\n${past ? "Previous explanations did not work:\n" + past + "\nUse a clearly different angle and split the idea into smaller steps." : ""}\nMethod: ${this.METHODS[method] || this.METHODS.simple}\nEnd with exactly one short check question the student must answer alone (do not give its answer).`, { onText, records: [gap] });
  },
  checkAnswer(gap, question, answer) {
    return this.ask("Rescue check", `${this.ctxSubject(gap.subjectId)}\nConcept: "${gap.text}"\nCheck question: ${question}\nStudent answer: ${answer}\nReply with only JSON: {"verdict":"correct"|"partly"|"wrong","why":"one or two sentences","nextStep":"one concrete next step"}`, { json: true, tier: "quick", records: [gap] });
  },
  professorQuestion(gap) {
    return this.ask("Professor question", `${this.ctxSubject(gap.subjectId)}\nThe student still does not understand: "${gap.text}". Context: ${gap.context || "none"}. Previous attempts: ${(gap.attempts || []).length}.\nWrite ONE precise, polite question the student can ask the professor (in the student's language), naming exactly which step or term is unclear. Reply with only the question.`, { tier: "quick", records: [gap] });
  },
  extractRequirements(text, project) {
    return this.ask("Brief → requirements", `Project: ${project.name}.\nBrief text:\n"""${text.slice(0, 12000)}"""\nExtract requirements as suggestions. Do not invent numbers. If something is ambiguous, put it in "questions" instead.\nReply with only JSON: {"requirements":[{"text":"…","mandatory":true,"source":"quote or location in the brief"}],"assumptions":[{"text":"…","reason":"…"}],"questions":["…"]}`, { json: true, records: [project] });
  },
  closeoutDraft(lecture, caps) {
    const lines = caps.map((c) => `- [${c.kind}] ${c.text}${c.page ? " (p." + c.page + ")" : ""}`).join("\n");
    return this.ask("Lecture closeout", `${this.ctxSubject(lecture.subjectId)}\nLecture: ${lecture.title || ""}\nCaptures:\n${lines}\nWrite a 3–5 line summary of what was covered, based only on these captures. Then list open questions. Reply with only JSON: {"summary":"…","open":["…"]}`, { json: true, tier: "quick", records: [lecture, ...caps] });
  },
  diagnostic(subject, topics) {
    return this.ask("Exam diagnostic", `${this.ctxSubject(subject.id)}\nTopics: ${topics.map((t) => t.name).join("; ")}.\nWrite a short diagnostic: for each topic one question that distinguishes "knows the basics" from "can solve alone". Reply with only JSON: [{"topic":"…","question":"…","whatGoodLooksLike":"…"}]`, { json: true, records: [subject] });
  },
  mockExam(subject, topics, n, minutes) {
    return this.ask("Mock exam", `${this.ctxSubject(subject.id)}\nCreate a ${minutes}-minute mock exam with ${n} questions on: ${topics.join("; ")}. Mix difficulty like a typical university exam. Reply with only JSON: [{"q":"question text","topic":"…","marks":number,"answer":"model answer or key steps"}]`, { json: true, tier: "complex", records: [subject] });
  },
  async council(question, context, onUpdate) {
    const roles = [["Tutor", "Explain the idea and the most useful way to think about it."], ["Critic", "Find the weak points, risks, hidden assumptions and what a strict professor would object to."], ["Examiner", "Turn it into what could be asked or graded, and how to prove mastery."]];
    const out = {};
    await Promise.all(roles.map(async ([r, brief]) => {
      try { out[r] = await this.ask("AI council · " + r, `Role: ${r}. ${brief}\nContext: ${context || "none"}\nQuestion: ${question}\nAnswer in at most 120 words.`, { tier: "quick" }); }
      catch (e) { out[r] = "(unavailable: " + e.message + ")"; }
      onUpdate && onUpdate({ ...out });
    }));
    out.Synthesis = await this.ask("AI council · synthesis", `Three perspectives on: ${question}\n${roles.map(([r]) => `${r}: ${out[r]}`).join("\n\n")}\nWrite a synthesis: where they agree, where they disagree (say so, don't hide it), and the one recommended next action. At most 150 words.`, { tier: "default" });
    onUpdate && onUpdate({ ...out });
    return out;
  },
  memoryPack(project, ctx) {
    return this.ask("Memory pack", `The student starts or continues: ${project.name}.\nRelevant history from their own records:\n${ctx}\nWrite a short "before you start" brief: repeated mistakes to avoid, professor preferences to respect, what worked before, weak skills to watch, realistic time notes. Only use the given history; say when history is thin. At most 180 words.`, { records: [project] });
  },
  drawingFeedback(blob, drill) {
    return this.ask("Drawing feedback", `This is a practice drawing for the exercise "${drill.name}": ${drill.goal}\nChecklist: ${(drill.checks || []).join("; ")}.\nGive specific, kind but honest feedback: 2 strengths, the 2 most important corrections (where on the drawing), and one drill for next time. This is a probability-based visual reading, not a grade — say so briefly.`, { images: [blob], records: [] });
  },
};

/* UI shell: router, schema-driven forms, modal, toasts, global capture, search, inbox, notifications. */
const esc = S5.esc;
S5.act = {};
S5.ICONS = {
  campus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2.5 9L12 4l9.5 5"/><path d="M4.5 9.5V19M19.5 9.5V19M8.5 11v6M12 11v6M15.5 11v6M3 20.5h18"/></svg>',
  tutor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8.5L12 4l9 4.5-9 4.5z"/><path d="M7 10.5v4.2c1.4 1.4 3 2.1 5 2.1s3.6-.7 5-2.1v-4.2"/><path d="M21 8.5v5"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="2.2" fill="currentColor" stroke="none"/></svg>',
  study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5.5c3-1.3 5.5-1 8 .8 2.5-1.8 5-2.1 8-.8V19c-3-1.2-5.5-.9-8 .9-2.5-1.8-5-2.1-8-.9z"/><path d="M12 6.3v13.4"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 20h18M5 20V9l7-5 7 5v11"/><path d="M9.5 20v-6h5v6"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20l3.5-1 10-10-2.5-2.5-10 10z"/><path d="M14 5.5l2.5 2.5M3 21h7"/><path d="M15 15l5 5M19 15l-4 4" opacity=".6"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 4h3v16H5zM10 4h3v16h-3z"/><path d="M15.2 4.6l2.9-.8 3.9 15.4-2.9.8z"/></svg>',
  system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
};
S5.NAV = [["campus", "Campus"], ["today", "Today"], ["study", "Study"], ["tutor", "Tutor"], ["projects", "Projects"], ["practice", "Practice"], ["library", "Library"]];

/* ---------- schemas: one place that defines every record type's fields ---------- */
const SUBJ = { k: "subjectId", label: "Subject", t: "ref", ref: "subject" };
const PROJ = { k: "projectId", label: "Project", t: "ref", ref: "project" };
S5.SCHEMA = {
  subject: { label: "Subject", fields: [{ k: "name", label: "Name (English)" }, { k: "ar", label: "Name (Arabic)" }, { k: "program", label: "Program", t: "select", options: [["arch", "Architecture & Building Technologies"], ["civil", "Civil Engineering"]] }, { k: "code", label: "Course code" }, { k: "ects", label: "Credits (ECTS or units)", t: "number" }, { k: "provisional", label: "Provisional (not confirmed by the department)", t: "bool" }, { k: "year", label: "Year", t: "number" }, { k: "semester", label: "Semester", t: "number" }, { k: "profile", label: "Profile", t: "select", options: () => Object.entries(S5.PROFILES).map(([k, v]) => [k, v.label]) }, { k: "professor", label: "Professor" }, { k: "room", label: "Room" }, { k: "notes", label: "Notes", t: "textarea", wide: 1 }] },
  slot: { label: "Timetable slot", fields: [SUBJ, { k: "day", label: "Day", t: "select", options: () => S5.DAYS.map((d, i) => [i, d]) }, { k: "start", label: "Start", t: "time" }, { k: "end", label: "End", t: "time" }, { k: "room", label: "Room" }, { k: "kind", label: "Kind", t: "select", options: [["lecture", "Lecture"], ["studio", "Studio"], ["lab", "Lab / workshop"], ["tutorial", "Tutorial"]] }] },
  lecture: { label: "Lecture", fields: [SUBJ, { k: "title", label: "Title / topic" }, { k: "date", label: "Date", t: "date" }, { k: "fileId", label: "Lecture PDF", t: "ref", ref: "file" }, { k: "summary", label: "Closeout summary", t: "textarea", wide: 1 }] },
  task: { label: "Task", fields: [{ k: "title", label: "Task", wide: 1 }, SUBJ, PROJ, { k: "due", label: "Due", t: "date" }, { k: "priority", label: "Priority", t: "select", options: [["critical", "Critical"], ["high", "High"], ["normal", "Normal"], ["low", "Low"]] }, { k: "estimateMin", label: "Estimate (min)", t: "number" }, { k: "actualMin", label: "Actual (min)", t: "number" }, { k: "status", label: "Status", t: "select", options: [["open", "Open"], ["doing", "Doing"], ["done", "Done"], ["dropped", "Dropped"]] }, { k: "notes", label: "Notes", t: "textarea", wide: 1 }] },
  session: { label: "Study session", fields: [SUBJ, { k: "reason", label: "Why this session", wide: 1 }, { k: "output", label: "Output", hint: "What exists when you finish" }, { k: "criterion", label: "Done when", hint: "A checkable criterion" }, { k: "plannedMin", label: "Planned (min)", t: "number" }, { k: "date", label: "Date", t: "date" }] },
  gap: { label: "Understanding gap", fields: [SUBJ, { k: "text", label: "What is unclear", t: "textarea", wide: 1 }, { k: "gapType", label: "Problem type", t: "select", options: [["term", "Unclear term"], ["concept", "Core concept"], ["step", "Missing step / application"], ["formula", "Formula or drawing"], ["tooFast", "Explained too fast"], ["prereq", "Missing prerequisite"], ["relation", "Relation between ideas"]] }, { k: "context", label: "Context (lecture, page, problem…)", wide: 1 }, { k: "page", label: "Page", t: "number" }] },
  question: { label: "Question for the professor", fields: [SUBJ, PROJ, { k: "text", label: "Question", t: "textarea", wide: 1 }, { k: "status", label: "Stage", t: "select", options: [["draft", "Drafted"], ["asked", "Asked"], ["answered", "Answered"], ["applied", "Applied"], ["verified", "Verified"]] }, { k: "answerVerbatim", label: "Professor's exact words", t: "textarea", wide: 1 }, { k: "interpretation", label: "My interpretation", t: "textarea", wide: 1 }, { k: "scope", label: "What kind of answer is it", t: "select", options: [["rule", "Scientific rule"], ["requirement", "Official requirement"], ["preference", "Professor preference"], ["projectNote", "Note for this project"], ["uncertain", "Uncertain"]] }] },
  assessment: { label: "Assessment", fields: [SUBJ, { k: "kind", label: "Assessment", hint: "Quiz, midterm, project, report…" }, { k: "date", label: "Date", t: "date" }, { k: "weight", label: "Weight %", t: "number" }, { k: "weightMin", label: "Weight min % (if unsure)", t: "number" }, { k: "weightMax", label: "Weight max %", t: "number" }, { k: "weightSource", label: "Source of the weight", hint: "Announcement, course description, professor, manual" }, { k: "confirmed", label: "Weight confirmed", t: "bool" }, { k: "topics", label: "Topics in scope", t: "textarea", wide: 1 }, { k: "allowed", label: "Allowed tools / open questions", wide: 1 }, { k: "place", label: "Place & time" }, { k: "score", label: "Score", t: "number" }, { k: "maxScore", label: "Out of", t: "number" }, { k: "readiness", label: "Self readiness (0–100)", t: "number" }] },
  topic: { label: "Topic", fields: [SUBJ, { k: "name", label: "Topic" }, { k: "scope", label: "Exam scope", t: "select", options: [["in", "In scope"], ["out", "Excluded"], ["maybe", "Probably"], ["confirm", "Needs confirmation"]] }, { k: "mastery", label: "Mastery", t: "select", options: () => S5.MASTERY.map((m, i) => [i, m]) }, { k: "sources", label: "Lectures / pages / examples", wide: 1 }] },
  problem: { label: "Problem", fields: [SUBJ, { k: "question", label: "Question", t: "textarea", wide: 1 }, { k: "source", label: "Source" }, { k: "attempt", label: "My attempt", t: "textarea", wide: 1 }, { k: "timeMin", label: "Time (min)", t: "number" }, { k: "correct", label: "Correct solution", t: "textarea", wide: 1 }, { k: "errorType", label: "Error type", t: "select", options: [["", "No error"], ["knowledge", "Knowledge"], ["application", "Application"], ["execution", "Execution / arithmetic"], ["exam", "Exam conditions (time, reading)"]] }, { k: "cause", label: "Where and why it went wrong", wide: 1 }, { k: "retryAt", label: "Retry on", t: "date" }, { k: "status", label: "Status", t: "select", options: [["new", "New"], ["retry", "To retry"], ["solvedHelp", "Solved with help"], ["solved", "Solved alone"], ["timed", "Solved under time"]] }] },
  file: { label: "File", fields: [{ k: "name", label: "Name", wide: 1 }, SUBJ, PROJ, { k: "kind", label: "Kind", t: "select", options: [["pdf", "PDF"], ["image", "Image"], ["video", "Video"], ["other", "Other"]] }, { k: "notes", label: "Notes", t: "textarea", wide: 1 }] },
  notebook: { label: "Notebook", fields: [{ k: "title", label: "Title", wide: 1 }, SUBJ, PROJ, { k: "template", label: "Paper", t: "select", options: () => Object.entries(S5.INK_TEMPLATES) }] },
  note: { label: "Text note", fields: [{ k: "title", label: "Title", wide: 1 }, SUBJ, PROJ, { k: "body", label: "Note", t: "textarea", wide: 1, rows: 10 }] },
  project: { label: "Project", fields: [{ k: "name", label: "Project name", wide: 1 }, SUBJ, { k: "professor", label: "Professor" }, { k: "deadline", label: "Official deadline", t: "date" }, { k: "internalDeadline", label: "My internal deadline", t: "date", hint: "Earlier than the official one" }, { k: "mode", label: "Mode", t: "select", options: [["individual", "Individual"], ["group", "Group"]] }, { k: "kind", label: "Type", t: "select", options: [["design", "Design project"], ["assignment", "Assignment"], ["report", "Report"], ["research", "Research"], ["graduation", "Graduation project"], ["site", "Site / survey work"]] }, { k: "weight", label: "Weight %", t: "number" }, { k: "phase", label: "Phase", t: "select", options: () => S5.PHASES.map((p) => [p[0], p[1]]) }, { k: "nextAction", label: "Next action (one)", wide: 1 }, { k: "brief", label: "Brief (original text)", t: "textarea", wide: 1 }] },
  requirement: { label: "Requirement", fields: [PROJ, { k: "text", label: "Requirement", t: "textarea", wide: 1 }, { k: "source", label: "Source (page, quote, who said it)" }, { k: "mandatory", label: "Mandatory", t: "bool" }, { k: "status", label: "Status", t: "select", options: [["open", "Open"], ["inProgress", "In progress"], ["met", "Met"], ["unclear", "Unclear"]] }, { k: "evidence", label: "Proof it is met", wide: 1 }] },
  assumption: { label: "Assumption", fields: [PROJ, { k: "text", label: "Assumption", wide: 1 }, { k: "reason", label: "Why" }, { k: "impact", label: "What it affects" }, { k: "needsConfirm", label: "Needs confirmation", t: "bool" }, { k: "validUntil", label: "Valid until", t: "date" }, { k: "status", label: "Status", t: "select", options: [["open", "Open"], ["confirmed", "Confirmed"], ["rejected", "Rejected"]] }] },
  reference: { label: "Reference", fields: [PROJ, { k: "title", label: "Building / precedent" }, { k: "architect", label: "Architect / source" }, { k: "reason", label: "Why chosen" }, { k: "idea", label: "Idea learned", wide: 1 }, { k: "transfer", label: "What is transferred", t: "select", options: [["principle", "A principle"], ["relation", "A relationship"], ["form", "A form (be careful)"], ["quote", "A quotation (cite it)"]] }, { k: "notToCopy", label: "What must not be copied", wide: 1 }, { k: "context", label: "Context (climate, Iraq, program)", wide: 1 }, { k: "confidence", label: "Confidence", t: "select", options: [["high", "High"], ["medium", "Medium"], ["low", "Low"]] }, { k: "fileId", label: "Image / file", t: "ref", ref: "file" }] },
  siteRecord: { label: "Site observation", fields: [PROJ, { k: "aspect", label: "Aspect", t: "select", options: [["boundary", "Boundaries"], ["north", "North / orientation"], ["roads", "Roads & access"], ["neighbours", "Neighbours"], ["pedestrians", "Pedestrian & car movement"], ["noise", "Noise"], ["privacy", "Privacy"], ["sun", "Sun"], ["wind", "Wind"], ["views", "Views"], ["vegetation", "Vegetation"], ["levels", "Levels"], ["utilities", "Utilities"], ["other", "Other"]] }, { k: "note", label: "Observation / conclusion", t: "textarea", wide: 1 }, { k: "evidence", label: "Evidence (photo, map, measurement)" }, { k: "value", label: "Measured value", t: "number" }, { k: "unit", label: "Unit" }, { k: "measure", label: "Actual or estimated", t: "select", options: [["", "—"], ["actual", "Actual"], ["estimated", "Estimated"], ["fromPhoto", "From photo (not for execution)"]] }, { k: "method", label: "Method" }, { k: "accuracy", label: "Accuracy" }, { k: "date", label: "Date", t: "date" }, { k: "verified", label: "Verified", t: "bool" }] },
  space: { label: "Space", fields: [PROJ, { k: "name", label: "Space" }, { k: "count", label: "Count", t: "number" }, { k: "area", label: "Area each (m²)", t: "number" }, { k: "users", label: "Users" }, { k: "activity", label: "Activity" }, { k: "privacy", label: "Privacy", t: "select", options: [["public", "Public"], ["semi", "Semi-public"], ["private", "Private"], ["service", "Service"]] }, { k: "outdoor", label: "Outdoor relation" }, { k: "notes", label: "Notes / professor remarks", wide: 1 }] },
  relation: { label: "Relationship", fields: [PROJ, { k: "a", label: "Space A", t: "ref", ref: "space" }, { k: "b", label: "Space B", t: "ref", ref: "space" }, { k: "kind", label: "Relationship", t: "select", options: [["direct", "Direct"], ["near", "Near"], ["separate", "Separate"], ["service", "Service"], ["visual", "Visual"], ["circulation", "Private circulation"]] }] },
  alternative: { label: "Alternative", fields: [PROJ, { k: "name", label: "Name" }, { k: "idea", label: "Idea", t: "textarea", wide: 1 }, { k: "strength", label: "Strengths" }, { k: "weakness", label: "Weaknesses" }, { k: "status", label: "Status", t: "select", options: [["active", "Active"], ["developing", "Developing"], ["paused", "Paused"], ["archived", "Archived"], ["chosen", "Chosen"]] }, { k: "timeMin", label: "Time spent (min)", t: "number" }] },
  decision: { label: "Decision", fields: [PROJ, { k: "title", label: "Decision", wide: 1 }, { k: "why", label: "Why", t: "textarea", wide: 1 }, { k: "sacrificed", label: "What was given up" }, { k: "influences", label: "Feedback that influenced it" }, { k: "state", label: "State", t: "select", options: [["temporary", "Temporary"], ["approved", "Approved"]] }] },
  feedback: { label: "Professor feedback", fields: [PROJ, SUBJ, { k: "verbatim", label: "Exact words", t: "textarea", wide: 1 }, { k: "interpretation", label: "My interpretation", t: "textarea", wide: 1 }, { k: "element", label: "Element it applies to" }, { k: "versionId", label: "Version reviewed", t: "ref", ref: "version" }, { k: "priority", label: "Priority", t: "select", options: [["critical", "Critical"], ["high", "High"], ["normal", "Normal"], ["low", "Low"]] }, { k: "scope", label: "Kind", t: "select", options: [["rule", "Scientific rule"], ["requirement", "Official requirement"], ["preference", "Professor preference"], ["projectNote", "Project note"], ["uncertain", "Uncertain"]] }, { k: "understood", label: "I understand it", t: "bool" }, { k: "status", label: "Status", t: "select", options: [["open", "Open"], ["task", "Turned into task"], ["applied", "Applied"], ["confirmed", "Confirmed in next review"], ["notApplied", "Not applied (reason)"]] }] },
  version: { label: "Version", fields: [PROJ, { k: "name", label: "Name" }, { k: "kind", label: "Kind", t: "select", options: [["named", "Named version"], ["approved", "Approved current"], ["review", "Review version"], ["freeze", "Submission freeze"]] }, { k: "reason", label: "Reason", wide: 1 }, { k: "changes", label: "What changed", t: "textarea", wide: 1 }, { k: "problems", label: "Known problems" }, { k: "timeMin", label: "Time spent (min)", t: "number" }] },
  deliverable: { label: "Deliverable", fields: [PROJ, { k: "kind", label: "Deliverable", t: "select", options: () => S5.DELIVERABLE_KINDS.map((k) => [k, k]) }, { k: "title", label: "Title" }, { k: "scale", label: "Scale" }, { k: "sourceVersionId", label: "Source version", t: "ref", ref: "version" }, { k: "status", label: "Status", t: "select", options: () => S5.DELIV_STATES.map((s) => [s, s]) }, { k: "estMin", label: "Estimate (min)", t: "number" }, { k: "actMin", label: "Actual (min)", t: "number" }, { k: "rubric", label: "Rubric / criteria", wide: 1 }, { k: "fileId", label: "File", t: "ref", ref: "file" }] },
  memory: { label: "Experience memory", fields: [{ k: "kind", label: "Kind", t: "select", options: [["mistake", "Mistake"], ["decision", "Decision"], ["professor", "Professor note"], ["lesson", "Lesson"], ["solution", "Solution"], ["question", "Question"], ["experiment", "Experiment"], ["preference", "Preference"], ["result", "Result"]] }, { k: "text", label: "What to remember", t: "textarea", wide: 1 }, { k: "context", label: "Context / scope", hint: "Project-specific or a general rule?" }, SUBJ, PROJ, { k: "stage", label: "Verification stage", t: "select", options: () => S5.MEM_STAGES.map((s, i) => [i, s]) }] },
  skill: { label: "Skill", fields: [{ k: "name", label: "Skill" }, { k: "parent", label: "Group", t: "ref", ref: "skill", filter: (r) => !r.parent }, { k: "state", label: "Level", t: "select", options: () => S5.SKILL_STATES.map((s, i) => [i, s]) }, { k: "active", label: "Active goal (max 3)", t: "bool" }] },
  portfolio: { label: "Portfolio item", fields: [{ k: "title", label: "Title", wide: 1 }, PROJ, { k: "problem", label: "Problem", t: "textarea", wide: 1 }, { k: "idea", label: "Idea", t: "textarea", wide: 1 }, { k: "role", label: "My role" }, { k: "tools", label: "Tools" }, { k: "skills", label: "Skills shown" }, { k: "feedback", label: "Feedback received", wide: 1 }, { k: "learned", label: "What I learned", wide: 1 }, { k: "fileId", label: "Main image / file", t: "ref", ref: "file" }] },
  source: { label: "Source", fields: [{ k: "title", label: "Title", wide: 1 }, { k: "author", label: "Author / body" }, { k: "kind", label: "Type", t: "select", options: [["book", "Book"], ["article", "Article"], ["lecture", "Lecture"], ["standard", "Standard / code"], ["building", "Building / case study"], ["website", "Website"], ["video", "Video"], ["material", "Material data"], ["ai", "AI output (not a source)"]] }, { k: "year", label: "Year / date" }, { k: "url", label: "Link" }, { k: "fileId", label: "File", t: "ref", ref: "file" }, { k: "pages", label: "Pages" }, { k: "confidence", label: "Confidence", t: "select", options: [["high", "High"], ["medium", "Medium"], ["low", "Low"]] }, SUBJ, PROJ, { k: "usage", label: "How I use it", wide: 1 }, { k: "citation", label: "Citation", wide: 1 }] },
  material: { label: "Material card", fields: [{ k: "name", label: "Material", wide: 1 }, { k: "category", label: "Category" }, { k: "properties", label: "Properties", t: "textarea", wide: 1 }, { k: "uses", label: "Uses" }, { k: "notes", label: "Observations / tests", wide: 1 }, { k: "safety", label: "Safety" }, { k: "source", label: "Source" }, { k: "fileId", label: "Photo", t: "ref", ref: "file" }] },
  siteVisit: { label: "Site visit", fields: [{ k: "title", label: "Visit", wide: 1 }, SUBJ, PROJ, { k: "date", label: "Date", t: "date" }, { k: "goal", label: "Goal", wide: 1 }, { k: "lookFor", label: "Elements to look for", t: "textarea", wide: 1 }, { k: "questions", label: "Questions to ask", t: "textarea", wide: 1 }, { k: "safety", label: "Safety checklist", t: "textarea", wide: 1 }, { k: "findings", label: "Findings (during)", t: "textarea", wide: 1 }, { k: "theoryVsReality", label: "Theory vs reality (after)", t: "textarea", wide: 1 }, { k: "report", label: "Short report", t: "textarea", wide: 1 }] },
  physical: { label: "Physical work", fields: [{ k: "title", label: "Title", wide: 1 }, { k: "kind", label: "Kind", t: "select", options: [["drawing", "Hand drawing"], ["board", "Board"], ["model", "Physical model"], ["workshop", "Workshop piece"], ["problemSheet", "Problem sheet"], ["correction", "Professor correction"]] }, SUBJ, PROJ, { k: "fileId", label: "Photo", t: "ref", ref: "file" }, { k: "beforeId", label: "Before (photo)", t: "ref", ref: "file" }, { k: "notes", label: "Notes", t: "textarea", wide: 1 }] },
  research: { label: "Research", fields: [{ k: "title", label: "Title", wide: 1 }, PROJ, { k: "question", label: "Research question", t: "textarea", wide: 1 }, { k: "methodology", label: "Methodology", t: "textarea", wide: 1 }, { k: "aiContribution", label: "What AI contributed (honest record)", t: "textarea", wide: 1 }, { k: "myContribution", label: "My contribution", t: "textarea", wide: 1 }] },
  claim: { label: "Claim", fields: [{ k: "researchId", label: "Research", t: "ref", ref: "research" }, { k: "text", label: "Claim", t: "textarea", wide: 1 }, { k: "evidence", label: "Evidence", t: "textarea", wide: 1 }, { k: "sourceId", label: "Source", t: "ref", ref: "source" }, { k: "quote", label: "Exact quote", wide: 1 }, { k: "pages", label: "Pages" }, { k: "strength", label: "Strength", t: "select", options: [["strong", "Strong"], ["moderate", "Moderate"], ["weak", "Weak"], ["conflict", "Sources conflict"]] }] },
  change: { label: "Change proposal", fields: [{ k: "title", label: "Proposed change", wide: 1 }, { k: "reason", label: "Reason", t: "textarea", wide: 1 }, { k: "impact", label: "Impact" }, { k: "alternatives", label: "Alternatives" }, { k: "status", label: "Status", t: "select", options: [["proposed", "Proposed"], ["review", "Under review"], ["approved", "Approved"], ["deferred", "Deferred"], ["rejected", "Rejected"], ["implemented", "Implemented"], ["replaced", "Replaced"]] }, { k: "decision", label: "Decision & who approved" }] },
  job: { label: "Computer job", fields: [{ k: "title", label: "Job", wide: 1 }, PROJ, { k: "app", label: "Program", t: "select", options: [["autocad", "AutoCAD"], ["revit", "Revit"], ["sketchup", "SketchUp"], ["lumion", "Lumion / renderer"], ["photoshop", "Photoshop"], ["export", "PDF export"], ["other", "Other"]] }, { k: "fileRef", label: "Workspace file (path inside Documents\\Studio5)" }, { k: "versionId", label: "Project version", t: "ref", ref: "version" }, { k: "preflight", label: "Preflight checks", t: "textarea", wide: 1 }, { k: "kind", label: "Job type", t: "select", options: [["open", "Open the file / app"], ["present", "Open and start presenting (F5)"], ["collect", "Collect the newest export into Studio5"]] }, { k: "ext", label: "Export type to collect (e.g. .pdf)" }, { k: "state", label: "State", t: "select", options: [["draft", "Draft"], ["queued", "Queued"], ["preflight", "Preflight"], ["approved", "Approved"], ["running", "Running"], ["verifying", "Verifying output"], ["done", "Done"], ["failed", "Failed"], ["cancelled", "Cancelled"]] }, { k: "result", label: "Result / artifact", wide: 1 }] },
  labReport: { label: "Lab report", fields: [{ k: "title", label: "Title", wide: 1 }, { k: "experiment", label: "Experiment", t: "select", options: () => S5.LAB.map(([k, n]) => [k, n]) }, SUBJ, { k: "summary", label: "Result summary", wide: 1 }, { k: "inputs", label: "Recorded data", t: "textarea", wide: 1, rows: 6 }, { k: "notes", label: "Discussion & conclusions", t: "textarea", wide: 1, rows: 5 }] },
  massing: { label: "Massing study", fields: [{ k: "name", label: "Name", wide: 1 }, PROJ] },
  calc: { label: "Saved calculation", fields: [{ k: "title", label: "Title", wide: 1 }, SUBJ, PROJ, { k: "notes", label: "Notes", t: "textarea", wide: 1 }] },
  discrepancy: { label: "Source discrepancy", fields: [{ k: "title", label: "Title" }, { k: "text", label: "Details", t: "textarea", wide: 1 }, { k: "status", label: "Status", t: "select", options: [["open", "Open"], ["confirmed", "Confirmed with department"], ["resolved", "Resolved"]] }] },
  evaluation: { label: "Post-evaluation", fields: [PROJ, { k: "grade", label: "Grade", t: "number" }, { k: "maxGrade", label: "Out of", t: "number" }, { k: "verbatim", label: "Professor's words", t: "textarea", wide: 1 }, { k: "strengths", label: "Strengths", wide: 1 }, { k: "weaknesses", label: "Weaknesses", wide: 1 }, { k: "lossCauses", label: "Where marks were lost", t: "multi", options: [["understanding", "Understanding"], ["design", "Design"], ["drawing", "Drawing"], ["feedback", "Ignored feedback"], ["time", "Time"], ["version", "Wrong version"], ["presentation", "Discussion / presentation"], ["technical", "Technical"]] }, { k: "lessons", label: "Lessons to keep", t: "textarea", wide: 1 }] },
};
S5.MASTERY = ["Not started", "Know the basics", "Understand, can't apply", "Solve with help", "Solve alone", "Solve under time", "Stable after a gap"];
S5.LADDER = ["Unclear", "Understood the explanation", "Applied with help", "Applied alone", "Applied under time", "Can explain it"];
S5.MEM_STAGES = ["First note", "Tried once", "Repeated", "Confirmed in context", "Approved experience"];
S5.SKILL_STATES = ["Not started", "Learning", "With help", "Alone", "Proficient", "Multiple contexts", "Can teach it"];
S5.PHASES = [["brief", "Brief & requirements"], ["time", "Time & phases"], ["research", "References & site"], ["program", "Program & relations"], ["alternatives", "Alternatives & decision"], ["development", "Development"], ["production", "Drawing & production"], ["submission", "Submission gate"], ["frozen", "Submitted (frozen)"], ["evaluated", "Evaluated"]];
S5.DELIVERABLE_KINDS = ["Plan", "Site plan", "Section", "Elevation", "Perspective", "Render", "Board", "Model", "Report", "Detail", "Presentation"];
S5.DELIV_STATES = ["not started", "draft", "developing", "in review", "ready", "outdated", "frozen"];
S5.CAPTURE_KINDS = [["note", "Note", "Quick text"], ["gap", "Didn't understand", "Rescue later"], ["deadline", "Required / due", "Becomes a task"], ["question", "Ask professor", "Question cycle"], ["verbatim", "Professor said", "Exact words"], ["decision", "Key example / decision", "Remember this"], ["photo", "Photo / page", "Image or file"]];

/* ---------- UI core ---------- */
S5.ui = {
  route: { v: "today" }, stack: [], cleanup: [],
  go(route, replace) {
    if (!replace) this.stack.push(this.route);
    if (this.stack.length > 40) this.stack.shift();
    this.route = typeof route === "string" ? { v: route } : route;
    try { if (S5.NAV.some((n) => n[0] === this.route.v) || this.route.v === "system") history.replaceState(null, "", "#" + this.route.v); } catch {}
    this.render(); document.getElementById("view").scrollTop = 0; window.scrollTo(0, 0);
  },
  back() { const r = this.stack.pop(); if (r) { this.route = r; this.render(); } else this.go("today", true); },
  root() { const v = this.route.v; return ({ subject: "study", lecture: "study", assessmentPlan: "study", mock: "study", focus: "today", project: "projects", notebook: "library", file: "library", drill: "practice", studio: "practice", tool: "practice", lab: "practice", atelier: "practice", tests: "system", remote: "system", search: "", inbox: "", notifications: "", research: "library", ...(S5.ROOT_EXTRA || {}) })[v] ?? v; },
  render() {
    this.cleanup.forEach((f) => { try { f(); } catch {} }); this.cleanup = [];
    this.renderChrome();
    document.body.dataset.route = this.route.v;
    const v = S5.views[this.route.v] || S5.views.today;
    const el = document.getElementById("view");
    try { el.innerHTML = v(this.route) || ""; S5.ui.mounts.splice(0).forEach((f) => { try { const c = f(); if (typeof c === "function") this.cleanup.push(c); } catch (e) { console.error(e); } }); }
    catch (e) { console.error(e); el.innerHTML = `<div class="sheet alert"><h3>This screen hit an error</h3><p class="small muted">${esc(e.message)}</p><div class="row" style="margin-top:10px"><button class="btn" data-act="go" data-v="today">Back to Today</button></div></div>`; }
  },
  mounts: [],
  mount(f) { this.mounts.push(f); },
  renderChromeNav() {
    const root = this.root(); const nav = () => S5.NAV.map(([k, n]) => `<button class="navbtn" data-act="go" data-v="${k}" aria-current="${root === k ? "page" : "false"}">${S5.ICONS[k]}<span>${n}</span></button>`).join("");
    document.getElementById("rail").innerHTML = `<div class="mark">S<span>5</span></div>${nav()}<div class="spacer"></div><button class="navbtn" data-act="go" data-v="system" aria-current="${root === "system" ? "page" : "false"}">${S5.ICONS.system}<span>System</span></button>`;
    document.getElementById("tabbar").innerHTML = nav();
  },
  renderChrome() {
    const root = this.root(); const nav = (cls) => S5.NAV.map(([k, n]) => `<button class="navbtn" data-act="go" data-v="${k}" aria-current="${root === k ? "page" : "false"}">${S5.ICONS[k]}<span>${n}</span></button>`).join("");
    document.getElementById("rail").innerHTML = `<div class="mark">S<span>5</span></div>${nav()}<div class="spacer"></div><button class="navbtn" data-act="go" data-v="system" aria-current="${root === "system" ? "page" : "false"}">${S5.ICONS.system}<span>System</span></button>`;
    document.getElementById("tabbar").innerHTML = nav();
    const inbox = S5.inboxItems().length; const notes = S5.notifications(); const crit = notes.filter((n) => n.p === 0).length;
    const lvl = S5.health.level(); const y = S5.settings.get("activeYear");
    document.getElementById("topbar").innerHTML = `
      <label class="search">${S5.ICONS.search}<input id="gsearch" type="search" placeholder="Search everything — lectures, pages, feedback, errors…" value="${esc(this.route.v === "search" ? this.route.q || "" : "")}" autocomplete="off" dir="auto"></label>
      ${S5.standalone && S5.store.meta.remote ? `<button class="chip-btn" data-act="go" data-v="remote" title="Laptop"><span class="health-dot ${S5.remote.laptopOnline ? "" : "bad"}"></span> Laptop</button>` : ""}<button class="chip-btn" data-act="go" data-v="inbox" title="Captured but not organised">Inbox <span class="count">${inbox}</span></button>
      <button class="chip-btn" data-act="go" data-v="notifications" title="Notifications">Alerts <span class="count ${crit ? "crit" : ""}">${crit || notes.filter((n) => n.p === 1).length}</span></button>
      <button class="chip-btn" data-act="lang" title="العربية / English" data-noi18n>${S5.i18n.lang() === "ar" ? "EN" : "ع"}</button>
      <button class="chip-btn hide-sm" data-act="go" data-v="system" title="System health"><span class="health-dot ${lvl === "ok" ? "" : lvl}"></span> Y${y}${S5.settings.get("safeMode") ? " · Safe" : ""}</button>`;
    const gs = document.getElementById("gsearch");
    gs.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go({ v: "search", q: gs.value }); });
    gs.addEventListener("input", S5.debounce(() => {
      if (gs.value.trim().length < 2) return;
      if (this.route.v === "search") { this.route.q = gs.value; S5.renderSearchResults && S5.renderSearchResults(); }
      else { this.stack.push(this.route); this.route = { v: "search", q: gs.value }; const el = document.getElementById("view"); el.innerHTML = S5.views.search(this.route); S5.renderSearchResults(); this.renderChromeNav(); }
    }, 300));
    const b = document.getElementById("banner"); const parts = [];
    if (S5.settings.get("safeMode")) parts.push(`<div class="banner safe"><strong>Academic Safe Mode</strong> — experimental tools hidden, backups more frequent, only critical alerts. <button class="btn sm" data-act="safe-off">Turn off</button></div>`);
    if (S5.idb.mode !== "indexeddb") parts.push(`<div class="banner"><strong>Storage is memory-only in this view.</strong> Your work disappears when the page closes. Export a backup from System, or open the page in a normal browser window.</div>`);
    if (S5.store.recovered) parts.push(`<div class="banner"><strong>Recovered.</strong> Unsaved ink from your last session was restored. <button class="btn sm" data-act="dismiss-recovered">OK</button></div>`);
    b.innerHTML = parts.join("");
  },
  toast(msg, bad) { const r = document.getElementById("toast-root"); const t = document.createElement("div"); t.className = "toast"; if (bad) t.style.background = "var(--redline)"; t.textContent = msg; r.appendChild(t); setTimeout(() => t.remove(), bad ? 6000 : 3200); },
  modal(title, body, { footer = "", wide, full, onMount, onClose } = {}) {
    const root = document.getElementById("modal-root"); const id = S5.uid("m");
    const d = document.createElement("div"); d.className = "scrim"; d.id = id;
    d.innerHTML = `<div class="modal ${wide ? "wide" : ""} ${full ? "full" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button class="x" data-close aria-label="Close">×</button></header><div class="body">${body}</div>${footer ? `<footer>${footer}</footer>` : ""}</div>`;
    root.appendChild(d);
    const close = () => { d.remove(); onClose && onClose(); document.removeEventListener("keydown", key); };
    const key = (e) => { if (e.key === "Escape" && root.lastElementChild === d) close(); };
    document.addEventListener("keydown", key);
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) close(); });
    const api = { el: d, close, body: d.querySelector(".body"), footer: d.querySelector("footer") };
    onMount && onMount(api);
    const f = d.querySelector("input:not([type=hidden]),textarea,select"); f && setTimeout(() => f.focus(), 30);
    return api;
  },
  confirm(text, yesLabel, onYes, danger = true) {
    const m = this.modal("Please confirm", `<p>${esc(text)}</p>`, { footer: `<button class="btn" data-close>Cancel</button><button class="btn ${danger ? "danger" : "primary"}" data-yes>${esc(yesLabel)}</button>` });
    m.el.querySelector("[data-yes]").onclick = async () => { m.close(); await onYes(); };
  },
  /* schema-driven form */
  fieldHTML(f, val, type) {
    const id = "f_" + f.k; const v = val ?? "";
    const wrap = (inner) => `<label class="field ${f.wide ? "wide" : ""}"><span>${esc(f.label)}</span>${inner}${f.hint ? `<small class="hint">${esc(f.hint)}</small>` : ""}</label>`;
    const t = f.t || "text";
    if (t === "textarea") return wrap(`<textarea id="${id}" name="${f.k}" dir="auto" rows="${f.rows || 3}">${esc(v)}</textarea>`);
    if (t === "bool") return `<label class="check ${f.wide ? "wide" : ""}"><input type="checkbox" id="${id}" name="${f.k}" ${v ? "checked" : ""}> ${esc(f.label)}</label>`;
    if (t === "select") { const opts = typeof f.options === "function" ? f.options() : f.options; return wrap(`<select id="${id}" name="${f.k}">${opts.map(([k, n]) => `<option value="${esc(k)}" ${String(k) === String(v) ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>`); }
    if (t === "multi") { const opts = f.options; const set = new Set(Array.isArray(v) ? v : []); return `<fieldset class="field wide" style="border:0;padding:0;margin:0"><span>${esc(f.label)}</span><div class="chips">${opts.map(([k, n]) => `<label class="check pill"><input type="checkbox" name="${f.k}" value="${k}" ${set.has(k) ? "checked" : ""}> ${esc(n)}</label>`).join("")}</div></fieldset>`; }
    if (t === "ref") {
      let opts = S5.store.list(f.ref, f.filter);
      if (f.ref === "subject") opts = opts.filter((s) => S5.subjectActive(s) || s.id === v).sort((a, b) => a.semester - b.semester);
      if (f.ref === "project") opts = opts.filter((p) => p.phase !== "evaluated" || p.id === v);
      return wrap(`<select id="${id}" name="${f.k}"><option value="">—</option>${opts.map((o) => `<option value="${o.id}" ${o.id === v ? "selected" : ""}>${esc(f.ref === "subject" ? `S${o.semester} · ${o.name}` : S5.title(o))}</option>`).join("")}</select>`);
    }
    const it = { number: "number", date: "date", time: "time", datetime: "datetime-local" }[t] || "text";
    return wrap(`<input id="${id}" name="${f.k}" type="${it}" ${it === "number" ? 'step="any" inputmode="decimal"' : ""} value="${esc(v)}" dir="auto">`);
  },
  readForm(root, fields) {
    const out = {};
    for (const f of fields) {
      if (f.t === "multi") { out[f.k] = [...root.querySelectorAll(`[name="${f.k}"]:checked`)].map((e) => e.value); continue; }
      const el = root.querySelector(`[name="${f.k}"]`); if (!el) continue;
      if (f.t === "bool") out[f.k] = el.checked;
      else if (f.t === "number") out[f.k] = el.value === "" ? null : parseFloat(el.value);
      else if (f.t === "select" && (f.k === "day" || f.k === "mastery" || f.k === "stage" || f.k === "state")) out[f.k] = el.value === "" ? null : isNaN(+el.value) ? el.value : +el.value;
      else out[f.k] = el.value.trim();
    }
    return out;
  },
  edit(type, recOrDefaults, { onSave, title, extra = "" } = {}) {
    const sch = S5.SCHEMA[type]; const isNew = !recOrDefaults?.id; const rec = recOrDefaults || {};
    const flagsHTML = isNew ? "" : `<label class="check wide"><input type="checkbox" name="noAI" ${rec.noAI ? "checked" : ""}> Never send this record to AI</label>`;
    const m = this.modal(title || (isNew ? "New " : "Edit ") + sch.label.toLowerCase(), `<form class="form-grid" id="edit-form">${sch.fields.map((f) => this.fieldHTML(f, rec[f.k])).join("")}${flagsHTML}${extra}</form>`, {
      wide: sch.fields.length > 8,
      footer: `${isNew ? "" : `<button class="btn danger" data-del style="margin-right:auto">Move to Trash</button>`}<button class="btn" data-close>Cancel</button><button class="btn primary" data-save>${isNew ? "Add" : "Save"}</button>`,
    });
    const form = m.el.querySelector("#edit-form");
    const save = async () => {
      const data = this.readForm(form, sch.fields);
      if (!isNew) { const n = form.querySelector('[name="noAI"]'); data.noAI = !!(n && n.checked); }
      const first = sch.fields[0]; const main = sch.fields.find((f) => ["name", "title", "text", "question", "verbatim", "kind"].includes(f.k));
      if (main && !data[main.k] && main.t !== "select") { this.toast(`Add a ${main.label.toLowerCase()} first`); return; }
      let saved;
      if (isNew) saved = await S5.store.create(type, { ...rec, ...data });
      else saved = await S5.store.update(rec.id, data);
      m.close(); this.toast(isNew ? `${sch.label} added` : "Saved");
      onSave && onSave(saved);
    };
    m.el.querySelector("[data-save]").onclick = save;
    form.addEventListener("submit", (e) => { e.preventDefault(); save(); });
    form.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(); });
    const del = m.el.querySelector("[data-del]");
    if (del) del.onclick = () => { m.close(); this.confirm(`Move “${S5.title(rec)}” to Trash? You can restore it from System → Trash.`, "Move to Trash", async () => { await S5.store.remove(rec.id); this.toast("Moved to Trash"); }); };
    return m;
  },
  async saveFile(name, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || "application/octet-stream" });
    let dl = null; try { dl = window.claude && (await window.claude.use("downloads")); } catch {}
    if (dl) { try { await dl.save({ filename: name, data: blob }); this.toast("Saved " + name); return true; } catch (e) { if (e && e.code === "cancelled") return false; } }
    if (S5.standalone) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); this.toast("Saved " + name); return true; }
    // fallback for views without the download capability: offer the text to copy (small files only)
    if (blob.size < 3e6 && /json|text|csv|markdown/.test(blob.type)) {
      const text = await blob.text();
      const m = this.modal("Copy your file", `<p class="small muted">This view cannot save files directly. Copy the content below and save it as <strong>${esc(name)}</strong>.</p><textarea readonly style="width:100%;height:280px;font-family:var(--f-mono);font-size:.72rem">${esc(text)}</textarea>`, { footer: `<button class="btn primary" data-copy>Copy</button>` });
      m.el.querySelector("[data-copy]").onclick = () => { const ta = m.el.querySelector("textarea"); navigator.clipboard?.writeText(text).then(() => this.toast("Copied"), () => { ta.select(); }); };
      return false;
    }
    this.toast("This view cannot save files. Open Studio5 signed in to claude.ai to export.", true); return false;
  },
  pickFile(accept, multiple) { return new Promise((res) => { const i = document.createElement("input"); i.type = "file"; if (accept) i.accept = accept; if (multiple) i.multiple = true; i.style.display = "none"; document.body.appendChild(i); i.onchange = () => { res([...i.files]); i.remove(); }; i.click(); setTimeout(() => { if (!i.files?.length) {} }, 0); }); },
};

/* ---------- small render helpers ---------- */
S5.h = {
  pill: (t, cls = "") => `<span class="pill ${cls}">${esc(t)}</span>`,
  btn: (label, act, data = {}, cls = "") => `<button class="btn ${cls}" data-act="${act}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}>${label}</button>`,
  empty: (title, text, action = "") => `<div class="empty"><strong>${esc(title)}</strong>${text ? `<br>${text}` : ""}${action ? `<div class="row" style="margin-top:10px">${action}</div>` : ""}</div>`,
  item: ({ lead = "", t, s = "", right = "", act, data = {}, dir }) => `<div class="item ${act ? "click" : ""}" ${act ? `data-act="${act}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}` : ""}><span class="lead ${lead}"></span><div style="min-width:0"><div class="t" dir="${dir || "auto"}">${t}</div>${s ? `<div class="s">${s}</div>` : ""}</div><div class="row nowrap">${right}</div></div>`,
  subj: (id) => { const s = S5.store.get(id); return s ? esc(s.name) : ""; },
  subjAr: (id) => { const s = S5.store.get(id); return s ? `<span class="ar" dir="rtl">${esc(s.ar)}</span>` : ""; },
  meter: (pct, cls = "") => `<div class="meter ${cls}"><i style="width:${S5.clamp(pct, 0, 100)}%"></i></div>`,
  ladder: (n, total) => `<div class="ladder" title="${n} of ${total}">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`,
  due: (iso) => { if (!iso) return ""; const n = S5.daysBetween(S5.todayISO(), iso.slice(0, 10)); const cls = n < 0 ? "red" : n <= 1 ? "amber" : n <= 7 ? "cobalt" : ""; return S5.h.pill(n < 0 ? `${-n}d overdue` : n === 0 ? "today" : n === 1 ? "tomorrow" : S5.fmtDate(iso), cls); },
  section: (title, body, right = "", cls = "") => `<section class="sheet ${cls}"><header><h3>${title}</h3><div class="row">${right}</div></header>${body}</section>`,
  tabs: (tabs, cur, act, data = {}) => `<div class="tabs" role="tablist">${tabs.map(([k, n, c]) => `<button role="tab" aria-selected="${k === cur}" data-act="${act}" data-tab="${k}" ${Object.entries(data).map(([a, b]) => `data-${a}="${esc(b)}"`).join(" ")}>${esc(n)}${c != null ? `<span class="n">${c}</span>` : ""}</button>`).join("")}</div>`,
  demo: (r) => (r.demo ? ' <span class="pill demo">example</span>' : ""),
  ai: () => `<span class="ai-label">AI interpretation · verify</span>`,
};

/* ---------- global capture ---------- */
S5.currentLecture = () => {
  const now = new Date(); const day = now.getDay(); const hm = now.toTimeString().slice(0, 5);
  const slot = S5.store.list("slot", (s) => +s.day === day && s.start <= hm && s.end >= hm && S5.subjectActive(S5.store.get(s.subjectId)))[0];
  return slot || null;
};
S5.ensureLecture = async (subjectId, date = S5.todayISO()) => {
  let lec = S5.store.list("lecture", (l) => l.subjectId === subjectId && l.date === date)[0];
  if (!lec) lec = await S5.store.create("lecture", { subjectId, date, title: "", status: "captured" });
  return lec;
};
S5.openCapture = (ctx = {}) => {
  const r = S5.ui.route; const slot = S5.currentLecture();
  ctx = { subjectId: ctx.subjectId || (r.v === "subject" ? r.id : r.v === "lecture" ? S5.store.get(r.id)?.subjectId : slot?.subjectId) || "", projectId: ctx.projectId || (r.v === "project" ? r.id : ""), lectureId: ctx.lectureId || (r.v === "lecture" ? r.id : ""), page: ctx.page || "", fileId: ctx.fileId || "", kind: ctx.kind || "note" };
  const kinds = S5.CAPTURE_KINDS.map(([k, n, s]) => `<button type="button" class="kind k-${k}" data-kind="${k}" aria-pressed="${k === ctx.kind}"><b>${n}</b><small>${s}</small></button>`).join("");
  const subjOpts = S5.store.list("subject", (s) => S5.subjectActive(s)).sort((a, b) => a.semester - b.semester).map((s) => `<option value="${s.id}" ${s.id === ctx.subjectId ? "selected" : ""}>S${s.semester} · ${esc(s.name)}</option>`).join("");
  const projOpts = S5.store.list("project", (p) => p.phase !== "evaluated").map((p) => `<option value="${p.id}" ${p.id === ctx.projectId ? "selected" : ""}>${esc(p.name)}</option>`).join("");
  const m = S5.ui.modal("Capture", `
    <div class="capture-kinds" id="cap-kinds">${kinds}</div>
    <label class="field"><span id="cap-label">What to capture</span><textarea id="cap-text" dir="auto" rows="3" placeholder="Type fast — organise later. Ctrl+Enter saves."></textarea></label>
    <div class="form-grid">
      <label class="field"><span>Subject</span><select id="cap-subj"><option value="">— (goes to Inbox)</option>${subjOpts}</select></label>
      <label class="field"><span>Project</span><select id="cap-proj"><option value="">—</option>${projOpts}</select></label>
      <label class="field"><span>Page</span><input id="cap-page" type="number" inputmode="numeric" value="${esc(ctx.page)}"></label>
      <label class="field" id="cap-due-wrap" hidden><span>Due</span><input id="cap-due" type="date"></label>
      <label class="field" id="cap-file-wrap" hidden><span>Photo or file</span><input id="cap-file" type="file" accept="image/*,application/pdf"></label>
    </div>
    ${slot ? `<p class="tiny muted">Now in timetable: ${esc(S5.store.get(slot.subjectId)?.name || "")} · ${slot.start}–${slot.end}. Captures attach to today's lecture.</p>` : ""}`,
    { footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cap-save">Save capture</button>` });
  let kind = ctx.kind;
  const setKind = (k) => { kind = k; m.el.querySelectorAll("[data-kind]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.kind === k)); m.el.querySelector("#cap-due-wrap").hidden = k !== "deadline"; m.el.querySelector("#cap-file-wrap").hidden = k !== "photo"; m.el.querySelector("#cap-label").textContent = { gap: "What exactly is unclear?", deadline: "What is required?", question: "Question for the professor", verbatim: "Professor's exact words (verbatim)", decision: "The example or decision worth remembering", photo: "Caption", note: "What to capture" }[k]; m.el.querySelector("#cap-text").focus(); };
  setKind(kind);
  m.el.querySelector("#cap-kinds").onclick = (e) => { const b = e.target.closest("[data-kind]"); if (b) setKind(b.dataset.kind); };
  const save = async () => {
    const text = m.el.querySelector("#cap-text").value.trim(); const subjectId = m.el.querySelector("#cap-subj").value; const projectId = m.el.querySelector("#cap-proj").value;
    const page = m.el.querySelector("#cap-page").value; const due = m.el.querySelector("#cap-due").value; const file = m.el.querySelector("#cap-file").files[0];
    if (!text && !file) { S5.ui.toast("Write something first"); return; }
    let lectureId = ctx.lectureId;
    if (!lectureId && subjectId && slot && slot.subjectId === subjectId) lectureId = (await S5.ensureLecture(subjectId)).id;
    let fileId = ctx.fileId;
    if (file) { const fr = await S5.intakeFile(file, { subjectId, projectId }); fileId = fr.id; }
    const cap = await S5.store.create("capture", { kind, text, subjectId, projectId, lectureId, page: page ? +page : null, fileId, due: due || null, resolved: false });
    if (kind === "deadline" && due) { const t = await S5.store.create("task", { title: text, subjectId, projectId, due, priority: "normal", status: "open", origin: "capture", captureId: cap.id }); await S5.store.update(cap.id, { resolved: true, convertedTo: t.id }); }
    if (kind === "verbatim" && projectId) { const fb = await S5.store.create("feedback", { projectId, subjectId, verbatim: text, status: "open", priority: "normal", understood: false }); await S5.store.update(cap.id, { resolved: true, convertedTo: fb.id }); }
    m.close(); S5.ui.toast(subjectId || projectId ? "Captured" : "Captured to Inbox");
  };
  m.el.querySelector("#cap-save").onclick = save;
  m.el.querySelector("#cap-text").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(); });
};

/* convert a capture into the right record (atomic: record + resolution) */
S5.resolveCapture = async (cap, to) => {
  const base = { subjectId: cap.subjectId || "", projectId: cap.projectId || "", lectureId: cap.lectureId || "" };
  let rec;
  if (to === "task") rec = await S5.store.create("task", { ...base, title: cap.text, due: cap.due || "", priority: "normal", status: "open", origin: "capture", captureId: cap.id });
  if (to === "gap") rec = await S5.store.create("gap", { ...base, text: cap.text, page: cap.page, context: cap.lectureId ? `Lecture ${S5.title(S5.store.get(cap.lectureId)) || S5.fmtDate(S5.store.get(cap.lectureId)?.date)}` : "", stage: 0, attempts: [], gapType: "concept" });
  if (to === "question") rec = await S5.store.create("question", { ...base, text: cap.text, status: "draft" });
  if (to === "feedback") rec = await S5.store.create("feedback", { ...base, verbatim: cap.text, status: "open", priority: "normal", understood: false });
  if (to === "memory") rec = await S5.store.create("memory", { ...base, kind: cap.kind === "verbatim" ? "professor" : "lesson", text: cap.text, stage: 0 });
  if (to === "note") rec = await S5.store.create("note", { ...base, title: cap.text.slice(0, 60), body: cap.text });
  await S5.store.update(cap.id, { resolved: true, convertedTo: rec ? rec.id : "kept", resolvedAs: to });
  if (rec) await S5.link(cap.id, "DERIVED_FROM", rec.id);
  return rec;
};

/* ---------- inbox & notifications ---------- */
S5.inboxItems = () => {
  const caps = S5.store.list("capture", (c) => !c.resolved);
  const orphanTasks = S5.store.list("task", (t) => t.status === "open" && !t.subjectId && !t.projectId && !t.personal);
  const orphanFiles = S5.store.list("file", (f) => !f.subjectId && !f.projectId && !f.library);
  return [...caps.map((r) => ({ r, why: "capture" })), ...orphanTasks.map((r) => ({ r, why: "task without subject" })), ...orphanFiles.map((r) => ({ r, why: "file not filed" }))];
};
S5.notifications = () => {
  const T = S5.todayISO(); const out = []; const safe = S5.settings.get("safeMode");
  const add = (p, text, act, data = {}) => out.push({ p, text, act, data });
  for (const t of S5.store.list("task", (t) => t.status !== "done" && t.status !== "dropped" && t.due)) {
    const n = S5.daysBetween(T, t.due);
    if (n < 0) add(t.priority === "critical" || t.priority === "high" ? 0 : 1, `Overdue: ${t.title}`, "edit", { type: "task", id: t.id });
    else if (n === 0) add(1, `Due today: ${t.title}`, "edit", { type: "task", id: t.id });
    else if (n <= 7 && !safe) add(2, `Due ${S5.relDay(t.due)}: ${t.title}`, "edit", { type: "task", id: t.id });
  }
  for (const p of S5.store.list("project", (p) => p.deadline && !["frozen", "evaluated"].includes(p.phase))) {
    const n = S5.daysBetween(T, p.deadline); const risk = S5.projectRisk(p);
    if (n <= 2 && n >= 0) add(0, `${p.name} is due ${S5.relDay(p.deadline)} — run the submission gate`, "open", { v: "project", id: p.id, tab: "gate" });
    else if (risk.level === "high") add(1, `${p.name}: ${risk.reason}`, "open", { v: "project", id: p.id });
  }
  for (const a of S5.store.list("assessment", (a) => a.date && a.score == null)) {
    const n = S5.daysBetween(T, a.date);
    if (n >= 0 && n <= 7) add(n <= 2 ? 0 : 1, `${a.kind} (${S5.store.get(a.subjectId)?.name || ""}) ${S5.relDay(a.date)}${a.confirmed ? "" : " — weight not confirmed"}`, "open", { v: "subject", id: a.subjectId, tab: "exams" });
    if (n < 0 && n > -14 && !safe) add(2, `Enter the result for ${a.kind} and run a quick debrief`, "edit", { type: "assessment", id: a.id });
  }
  const unclosed = S5.store.list("lecture", (l) => l.status !== "closed" && l.date && l.date <= T && S5.store.list("capture", (c) => c.lectureId === l.id && !c.resolved).length);
  if (unclosed.length) add(1, `${unclosed.length} lecture(s) waiting for closeout`, "open", { v: "lecture", id: unclosed[0].id, tab: "closeout" });
  for (const p of S5.store.list("problem", (p) => p.retryAt && p.retryAt <= T && p.status !== "solved" && p.status !== "timed")) add(2, `Retry problem: ${p.question.slice(0, 60)}`, "open", { v: "subject", id: p.subjectId, tab: "problems" });
  const gaps = S5.store.list("gap", (g) => (g.attempts || []).filter((a) => a.result === "still unclear").length >= 2 && g.stage < 1);
  for (const g of gaps) add(1, `Explanation failed twice: “${g.text.slice(0, 50)}” — change method or ask the professor`, "rescue", { id: g.id });
  const lb = S5.store.meta.lastBackupAt;
  if (!lb || S5.daysBetween(lb.slice(0, 10), T) > S5.settings.get("backupEveryDays")) add(1, lb ? `Last full backup was ${S5.relDay(lb.slice(0, 10))}` : "No full backup yet — export one", "go", { v: "system" });
  if (S5.health.level() === "bad") add(0, "System health needs attention", "go", { v: "system" });
  if (S5.sync.state === "error") add(3, "Cloud sync interrupted — your changes are safe on this device", "go", { v: "system" });
  return out.filter((n) => !safe || n.p <= 1).sort((a, b) => a.p - b.p);
};

/* ---------- project risk & time intelligence (used by Today and Projects) ---------- */
S5.projectRisk = (p) => {
  const T = S5.todayISO(); if (!p.deadline) return { level: "low", reason: "No deadline set", score: 0 };
  const days = S5.daysBetween(T, p.internalDeadline || p.deadline);
  const delivs = S5.store.where("deliverable", "projectId", p.id);
  const remainingMin = delivs.filter((d) => !["ready", "frozen"].includes(d.status)).reduce((a, d) => a + Math.max(0, (d.estMin || 120) - (d.actMin || 0)), 0) + S5.store.list("task", (t) => t.projectId === p.id && t.status !== "done" && t.status !== "dropped").reduce((a, t) => a + (t.estimateMin || 60), 0);
  const openFb = S5.store.list("feedback", (f) => f.projectId === p.id && ["open", "task"].includes(f.status)).length;
  const unclearFb = S5.store.list("feedback", (f) => f.projectId === p.id && !f.understood && f.status === "open").length;
  const perDay = S5.settings.get("energyMin") * 0.45; // share of a day realistically available for one project
  const capacity = Math.max(0, days) * perDay;
  const ratio = capacity ? remainingMin / capacity : remainingMin ? 9 : 0;
  let level = "low", reason = "On track";
  if (days < 0) { level = "high"; reason = "Past your internal deadline"; }
  else if (ratio > 1) { level = "high"; reason = `Needs ~${S5.fmtMin(remainingMin)}, about ${S5.fmtMin(capacity)} realistically available`; }
  else if (ratio > 0.7 || unclearFb) { level = "medium"; reason = unclearFb ? `${unclearFb} feedback item(s) not understood yet` : "Tight: most of the remaining time is already needed"; }
  return { level, reason, score: ratio + unclearFb * 0.3 + (days < 3 ? 0.5 : 0), remainingMin, capacity, openFb, days };
};
S5.estimateRange = (estMin, kind) => {
  // learn from history: actual/estimate ratio of finished tasks & deliverables
  const done = [...S5.store.list("task", (t) => t.status === "done" && t.estimateMin && t.actualMin), ...S5.store.list("deliverable", (d) => d.estMin && d.actMin && ["ready", "frozen"].includes(d.status))];
  const ratios = done.map((d) => (d.actualMin || d.actMin) / (d.estimateMin || d.estMin)).sort((a, b) => a - b);
  if (ratios.length < 3) return { lo: Math.round(estMin * 0.9), hi: Math.round(estMin * 1.6), conf: "low", why: "Little history yet — using a default buffer of +60%" };
  const q = (p) => ratios[Math.min(ratios.length - 1, Math.floor(p * ratios.length))];
  return { lo: Math.round(estMin * q(0.25)), hi: Math.round(estMin * q(0.8)), conf: ratios.length > 10 ? "medium" : "low", why: `Based on ${ratios.length} finished items: you usually take ${S5.round(q(0.5), 2)}× your estimate` };
};

/* ---------- unified search ---------- */
S5.SEARCH_FIELDS = ["title", "name", "ar", "text", "question", "verbatim", "interpretation", "summary", "body", "idea", "note", "reason", "attempt", "correct", "cause", "topics", "brief", "notes", "properties", "uses", "findings", "citation", "answerVerbatim", "author", "evidence", "quote", "goal", "kind"];
S5.search = async (q) => {
  q = (q || "").trim().toLowerCase(); if (q.length < 2) return [];
  const terms = q.split(/\s+/); const out = [];
  for (const r of S5.store.recs.values()) {
    if (r.deleted || ["link", "inkpage", "drillDef", "year", "semester"].includes(r.type)) continue;
    const hay = S5.SEARCH_FIELDS.map((f) => (typeof r[f] === "string" ? r[f] : "")).join("   ").toLowerCase();
    if (terms.every((t) => hay.includes(t))) { const i = hay.indexOf(terms[0]); out.push({ r, snip: hay.slice(Math.max(0, i - 50), i + 90) }); }
  }
  // inside PDFs (device-local text index)
  for (const f of S5.store.list("file", (f) => f.kind === "pdf")) {
    const pages = await S5.idb.get("meta", "pdftext_" + f.id); if (!pages) continue;
    pages.forEach((t, i) => { const l = t.toLowerCase(); if (terms.every((x) => l.includes(x))) { const j = l.indexOf(terms[0]); out.push({ r: f, page: i + 1, snip: t.slice(Math.max(0, j - 50), j + 90) }); } });
  }
  return out.slice(0, 200);
};
S5.openRecord = (r, page) => {
  const go = (x) => S5.ui.go(x);
  switch (r.type) {
    case "subject": return go({ v: "subject", id: r.id });
    case "lecture": return go({ v: "lecture", id: r.id });
    case "project": return go({ v: "project", id: r.id });
    case "file": return go({ v: "file", id: r.id, page });
    case "notebook": return go({ v: "notebook", id: r.id });
    case "research": return go({ v: "research", id: r.id });
    case "gap": return S5.rescue(r.id);
    case "capture": return go({ v: "inbox" });
    default:
      if (r.projectId && ["requirement", "assumption", "reference", "siteRecord", "space", "relation", "alternative", "decision", "feedback", "version", "deliverable", "evaluation"].includes(r.type)) return go({ v: "project", id: r.projectId, tab: { requirement: "brief", assumption: "brief", reference: "references", siteRecord: "site", space: "program", relation: "program", alternative: "alternatives", decision: "alternatives", feedback: "feedback", version: "versions", deliverable: "deliverables", evaluation: "evaluation" }[r.type] });
      if (S5.SCHEMA[r.type]) return S5.ui.edit(r.type, r);
  }
};
S5.typeLabel = (t) => (S5.SCHEMA[t]?.label) || { capture: "Capture", inkpage: "Ink page", drill: "Drawing attempt", link: "Relation" }[t] || t;

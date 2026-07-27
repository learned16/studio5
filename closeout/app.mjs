import { openBrowserLectureCloseoutDemo } from "./runtime.mjs";

const KIND_LABELS = Object.freeze({
  "understanding-gap": "ما فهمت",
  important: "مهم",
  assignment: "تكليف",
  "professor-question": "سؤال للأستاذ",
  "professor-feedback": "ملاحظة أستاذ",
});

const OUTCOME_META = Object.freeze({
  task: { label: "مهمة", className: "task" },
  review: { label: "مراجعة", className: "review" },
  inbox: { label: "يبقى Inbox", className: "inbox" },
  answered: { label: "تمت الإجابة", className: "answered" },
  dismissed: { label: "تجاهل", className: "dismissed" },
});

const lectureTitle = document.querySelector("#lecture-title");
const lectureSubject = document.querySelector("#lecture-subject");
const progressCount = document.querySelector("#progress-count");
const startCard = document.querySelector("#start-card");
const startButton = document.querySelector("#start-closeout");
const completedBanner = document.querySelector("#completed-banner");
const completedSummary = document.querySelector("#completed-summary");
const closeoutStatus = document.querySelector("#closeout-status");
const emptyState = document.querySelector("#empty-state");
const closeoutList = document.querySelector("#closeout-list");
const finishCard = document.querySelector("#finish-card");
const finishGuidance = document.querySelector("#finish-guidance");
const summaryInput = document.querySelector("#closeout-summary");
const completeButton = document.querySelector("#complete-closeout");
const pageMessage = document.querySelector("#page-message");
const connectionPill = document.querySelector("#connection-pill");
const connectionLabel = document.querySelector("#connection-label");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskCaptureId = document.querySelector("#task-capture-id");
const taskTitle = document.querySelector("#task-title");
const taskPriority = document.querySelector("#task-priority");
const taskDue = document.querySelector("#task-due");

let demo;
let latestState;
let busy = false;

function setMessage(text, { error = false } = {}) {
  pageMessage.textContent = text;
  pageMessage.classList.toggle("is-error", error);
}

function formatTime(instant) {
  return new Intl.DateTimeFormat("ar-IQ", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(instant));
}

function resolutionBadge(outcome) {
  const meta = OUTCOME_META[outcome];
  const badge = document.createElement("span");
  badge.className = `resolution-badge is-${meta?.className ?? "resolved"}`;
  badge.textContent = meta?.label ?? outcome;
  return badge;
}

function actionButton(captureId, outcome) {
  const meta = OUTCOME_META[outcome];
  const button = document.createElement("button");
  button.type = "button";
  button.className = `resolution-action is-${meta.className}`;
  button.dataset.captureId = captureId;
  button.dataset.outcome = outcome;
  button.textContent = meta.label;
  button.disabled = busy;
  return button;
}

function captureCard(item, closeout) {
  const card = document.createElement("li");
  card.className = "capture-card";
  card.dataset.captureId = item.capture.id;

  const top = document.createElement("div");
  top.className = "capture-top";
  const kind = document.createElement("span");
  kind.className = "capture-kind";
  kind.textContent = KIND_LABELS[item.capture.captureKind] ?? item.capture.captureKind;
  const time = document.createElement("time");
  time.dateTime = item.capture.capturedAt;
  time.textContent = formatTime(item.capture.capturedAt);
  top.append(kind, time);

  const text = document.createElement("p");
  text.className = "capture-text";
  text.textContent = item.capture.text;

  const bottom = document.createElement("div");
  bottom.className = "capture-bottom";
  if (item.resolution) {
    bottom.classList.add("is-resolved");
    const result = resolutionBadge(item.resolution.outcome);
    bottom.append(result);
    if (item.task) {
      const detail = document.createElement("small");
      detail.textContent = item.task.dueAt
        ? `موعد المهمة: ${new Intl.DateTimeFormat("ar-IQ", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(item.task.dueAt))}`
        : "مهمة محفوظة بلا موعد";
      bottom.append(detail);
    }
  } else if (closeout?.status === "in-progress") {
    const actions = document.createElement("div");
    actions.className = "resolution-actions";
    for (const outcome of ["task", "review", "inbox", "answered", "dismissed"]) {
      actions.append(actionButton(item.capture.id, outcome));
    }
    bottom.append(actions);
  } else {
    const pending = document.createElement("span");
    pending.className = "pending-label";
    pending.textContent = closeout?.status === "completed"
      ? "أضيفت بعد إكمال Closeout"
      : "ابدأ Closeout حتى تحسمها";
    bottom.append(pending);
  }

  card.append(top, text, bottom);
  return card;
}

async function render() {
  latestState = await demo.snapshot();
  const total = latestState.captures.length;
  const resolved = latestState.captures.filter(({ resolution }) => resolution).length;
  const remaining = total - resolved;
  const closeout = latestState.closeout;

  lectureTitle.textContent = latestState.lecture.title;
  lectureSubject.textContent = `${latestState.subject.title} · ${latestState.semester.label}`;
  progressCount.textContent = `${resolved} / ${total}`;
  closeoutList.replaceChildren(
    ...latestState.captures.map((item) => captureCard(item, closeout)),
  );
  emptyState.hidden = total > 0;
  closeoutList.hidden = total === 0;

  const completed = closeout?.status === "completed";
  startCard.hidden = Boolean(closeout) || total === 0;
  finishCard.hidden = !closeout || completed || total === 0;
  completedBanner.hidden = !completed;
  closeoutStatus.textContent = completed
    ? "مكتمل"
    : closeout
      ? "قيد التنظيم"
      : "لم تبدأ";
  closeoutStatus.classList.toggle("is-completed", completed);
  closeoutStatus.classList.toggle("is-active", Boolean(closeout) && !completed);

  if (completed) {
    completedSummary.textContent = closeout.summary || "كل النقاط محسومة ومحفوظة.";
  }
  if (closeout && !completed) {
    completeButton.disabled = remaining > 0 || total === 0 || busy;
    finishGuidance.textContent = remaining > 0
      ? `باقي ${remaining} ${remaining === 1 ? "نقطة" : "نقاط"} تحتاج حسم.`
      : "كل النقاط محسومة. تقدر تكمل Closeout.";
  }
}

async function runAction(action, successMessage) {
  if (busy) return;
  busy = true;
  setMessage("جاري الحفظ محلياً…");
  try {
    await action();
    await render();
    setMessage(successMessage);
  } catch (error) {
    console.error(error);
    setMessage("تعذر حفظ القرار. البيانات الخام بقيت كما هي؛ حاول مرة ثانية.", {
      error: true,
    });
  } finally {
    busy = false;
    await render().catch(() => undefined);
  }
}

function openTaskDialog(captureId) {
  const item = latestState.captures.find(({ capture }) => capture.id === captureId);
  if (!item) return;
  taskCaptureId.value = captureId;
  taskTitle.value = item.capture.text;
  taskPriority.value = "normal";
  taskDue.value = "";
  taskDialog.showModal();
}

closeoutList.addEventListener("click", (event) => {
  const button = event.target.closest(".resolution-action");
  if (!button) return;
  const { captureId, outcome } = button.dataset;
  if (outcome === "task") {
    openTaskDialog(captureId);
    return;
  }
  void runAction(
    () => demo.resolve(captureId, { outcome }),
    `انحسمت النقطة كـ «${OUTCOME_META[outcome].label}».`,
  );
});

startButton.addEventListener("click", () => {
  void runAction(
    () => demo.start(),
    "بدأت جلسة التنظيم. احسم كل نقطة بالنتيجة المناسبة.",
  );
});

completeButton.addEventListener("click", () => {
  void runAction(
    () => demo.complete(summaryInput.value.trim() || null),
    "اكتملت مراجعة المحاضرة وانحفظت الخلاصة.",
  );
});

taskForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const dueAt = taskDue.value ? new Date(taskDue.value).toISOString() : null;
  const captureId = taskCaptureId.value;
  const title = taskTitle.value.trim();
  if (!title) {
    taskTitle.focus();
    return;
  }
  taskDialog.close();
  void runAction(
    () => demo.resolve(captureId, {
      outcome: "task",
      title,
      priority: taskPriority.value,
      dueAt,
    }),
    "تحولت النقطة إلى مهمة مرتبطة بالمحاضرة.",
  );
});

function updateConnection() {
  const offline = !navigator.onLine;
  connectionPill.classList.toggle("is-offline", offline);
  connectionLabel.textContent = offline ? "يعمل دون إنترنت" : "محلي ومحفوظ";
}

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);

async function start() {
  updateConnection();
  try {
    demo = await openBrowserLectureCloseoutDemo();
    await render();
    setMessage("كل القرارات تنحفظ محلياً، والـCapture الخام يبقى محفوظاً.");
  } catch (error) {
    console.error(error);
    setMessage("تعذر فتح ذاكرة المحاضرة المحلية. أعد تحميل الصفحة.", {
      error: true,
    });
  }
}

void start();

import { openBrowserLectureCaptureDemo } from "./core-runtime.mjs";
import { setUserText } from "./user-content.mjs";

const KIND_META = Object.freeze({
  "understanding-gap": {
    label: "ما فهمت",
    placeholder: "شنو بالضبط ما فهمت؟ اكتب الخطوة أو الفكرة بسرعة…",
  },
  important: {
    label: "مهم",
    placeholder: "اكتب النقطة المهمة كما شرحها الأستاذ…",
  },
  assignment: {
    label: "تكليف",
    placeholder: "شنو المطلوب؟ اكتب التكليف وموعده إذا ذكره الأستاذ…",
  },
  "professor-question": {
    label: "سؤال للأستاذ",
    placeholder: "اكتب السؤال حتى ما تنساه قبل نهاية المحاضرة…",
  },
  "professor-feedback": {
    label: "ملاحظة أستاذ",
    placeholder: "سجل كلام الأستاذ أو التصحيح كما قاله قدر الإمكان…",
  },
});

const form = document.querySelector("#capture-form");
const textarea = document.querySelector("#capture-text");
const saveButton = document.querySelector("#save-capture");
const typeButtons = [...document.querySelectorAll(".capture-type")];
const message = document.querySelector("#form-message");
const captureList = document.querySelector("#capture-list");
const emptyState = document.querySelector("#empty-state");
const inboxCount = document.querySelector("#inbox-count");
const captureCount = document.querySelector("#capture-count");
const lectureTitle = document.querySelector("#lecture-title");
const lectureSubject = document.querySelector("#lecture-subject");
const connectionPill = document.querySelector("#connection-pill");
const connectionLabel = document.querySelector("#connection-label");

let selectedKind = "understanding-gap";
let demo;
let saving = false;

function setMessage(text, { error = false } = {}) {
  message.textContent = text;
  message.classList.toggle("is-error", error);
}

function selectKind(kind) {
  selectedKind = kind;
  for (const button of typeButtons) {
    const selected = button.dataset.kind === kind;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
  }
  textarea.placeholder = KIND_META[kind].placeholder;
  textarea.focus({ preventScroll: true });
}

function formatTime(instant) {
  return new Intl.DateTimeFormat("ar-IQ", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(instant));
}

function captureItem(capture) {
  const item = document.createElement("li");
  item.className = "capture-item";

  const badge = document.createElement("span");
  badge.className = "capture-item-badge";
  badge.textContent = KIND_META[capture.captureKind]?.label ?? capture.captureKind;

  const content = document.createElement("p");
  setUserText(content, capture.text);

  const time = document.createElement("time");
  time.dateTime = capture.capturedAt;
  time.textContent = formatTime(capture.capturedAt);

  item.append(badge, content, time);
  return item;
}

async function render() {
  const [captures, inbox] = await Promise.all([
    demo.listCaptures(),
    demo.inbox(),
  ]);
  const newestFirst = [...captures].reverse();
  captureList.replaceChildren(...newestFirst.map(captureItem));
  emptyState.hidden = newestFirst.length > 0;
  captureList.hidden = newestFirst.length === 0;
  inboxCount.textContent = String(inbox.length);
  captureCount.textContent = `${newestFirst.length} ${newestFirst.length === 1 ? "نقطة" : "نقاط"}`;
}

async function saveCapture() {
  const text = textarea.value.trim();
  if (!text) {
    setMessage("اكتب النقطة أولاً حتى تنحفظ.", { error: true });
    textarea.focus();
    return;
  }
  if (saving) return;
  saving = true;
  saveButton.disabled = true;
  setMessage("جاري الحفظ محلياً…");
  try {
    await demo.capture({ kind: selectedKind, text });
    textarea.value = "";
    await render();
    setMessage(`انحفظت كـ «${KIND_META[selectedKind].label}» داخل المحاضرة.`);
    textarea.focus({ preventScroll: true });
  } catch (error) {
    console.error(error);
    setMessage("ما انحفظت النقطة. بياناتك الحالية بقيت كما هي؛ حاول مرة ثانية.", {
      error: true,
    });
  } finally {
    saving = false;
    saveButton.disabled = false;
  }
}

function updateConnection() {
  const offline = !navigator.onLine;
  connectionPill.classList.toggle("is-offline", offline);
  connectionLabel.textContent = offline ? "يعمل دون إنترنت" : "محلي ومحفوظ";
}

for (const button of typeButtons) {
  button.addEventListener("click", () => selectKind(button.dataset.kind));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveCapture();
});

textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    void saveCapture();
  }
});

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);

async function start() {
  updateConnection();
  try {
    demo = await openBrowserLectureCaptureDemo();
    setUserText(lectureTitle, demo.lecture.title);
    setUserText(lectureSubject, `${demo.subject.title} · ${demo.semester.label}`);
    await render();
    selectKind(selectedKind);
    setMessage("جاهز للالتقاط. كل شيء ينحفظ على هذا الجهاز.");
  } catch (error) {
    console.error(error);
    setMessage("تعذر فتح الذاكرة المحلية. أعد تحميل الصفحة وحاول مرة ثانية.", {
      error: true,
    });
    saveButton.disabled = true;
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}

void start();

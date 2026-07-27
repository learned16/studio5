import { createLectureCaptureDemo } from "../lecture-demo.mjs";

const RESOLUTION_OUTCOMES = new Set([
  "review",
  "inbox",
  "answered",
  "dismissed",
]);

export async function createLectureCloseoutDemo(repository, options = {}) {
  if (!repository || typeof repository.startLectureCloseout !== "function") {
    throw new TypeError("Lecture Closeout demo requires an AcademicRepository");
  }
  const captureDemo = await createLectureCaptureDemo(repository, options);

  async function snapshot() {
    const [
      captures,
      closeouts,
      resolutions,
      tasks,
      inbox,
    ] = await Promise.all([
      repository.listLectureCaptures({ lectureId: captureDemo.lecture.id }),
      repository.listLectureCloseouts({ lectureId: captureDemo.lecture.id }),
      repository.listCaptureResolutions(),
      repository.listTasks({ lectureId: captureDemo.lecture.id }),
      repository.buildLectureInbox({ lectureId: captureDemo.lecture.id }),
    ]);
    const closeout = closeouts[0] ?? null;
    const resolutionByCapture = new Map(
      resolutions.map((resolution) => [resolution.captureId, resolution]),
    );
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    return {
      lecture: captureDemo.lecture,
      subject: captureDemo.subject,
      semester: captureDemo.semester,
      closeout,
      inbox,
      captures: captures.map((capture) => {
        const resolution = resolutionByCapture.get(capture.id) ?? null;
        return {
          capture,
          resolution,
          task: resolution?.taskId ? taskById.get(resolution.taskId) ?? null : null,
        };
      }),
    };
  }

  async function activeCloseout() {
    const state = await snapshot();
    if (!state.closeout) {
      throw new TypeError("Start the lecture closeout before resolving captures");
    }
    if (state.closeout.status !== "in-progress") {
      throw new TypeError("The lecture closeout is already completed");
    }
    return state.closeout;
  }

  return {
    lecture: captureDemo.lecture,
    subject: captureDemo.subject,
    semester: captureDemo.semester,
    snapshot,
    start() {
      return repository.startLectureCloseout(captureDemo.lecture.id);
    },
    async resolve(captureId, {
      outcome,
      title = null,
      priority = "normal",
      dueAt = null,
    }) {
      if (outcome === "task") {
        await activeCloseout();
        return repository.resolveLectureCaptureAsTask(captureId, {
          title,
          priority,
          dueAt,
        });
      }
      if (!RESOLUTION_OUTCOMES.has(outcome)) {
        throw new TypeError(`Unsupported Closeout outcome: ${outcome}`);
      }
      const closeout = await activeCloseout();
      return repository.resolveLectureCapture(captureId, {
        closeoutId: closeout.id,
        outcome,
      });
    },
    async complete(summary = null) {
      const closeout = await activeCloseout();
      return repository.completeLectureCloseout(closeout.id, { summary });
    },
  };
}

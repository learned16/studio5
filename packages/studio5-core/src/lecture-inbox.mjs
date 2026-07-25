import { assertStableId } from "./ids.mjs";

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
  return value;
}

export function buildLectureInbox({
  captures = [],
  resolutions = [],
  lectures = [],
  subjects = [],
} = {}, {
  lectureId = null,
  subjectId = null,
} = {}) {
  const sourceCaptures = requireArray(captures, "captures");
  const sourceResolutions = requireArray(resolutions, "resolutions");
  const lectureMap = new Map(
    requireArray(lectures, "lectures").map((lecture) => [lecture.id, lecture]),
  );
  const subjectMap = new Map(
    requireArray(subjects, "subjects").map((subject) => [subject.id, subject]),
  );
  const normalizedLectureId = lectureId
    ? assertStableId(lectureId, "lecture")
    : null;
  const normalizedSubjectId = subjectId
    ? assertStableId(subjectId, "subject")
    : null;
  const resolutionByCapture = new Map(
    sourceResolutions.map((resolution) => [resolution.captureId, resolution]),
  );

  return sourceCaptures
    .map((capture) => {
      const lecture = lectureMap.get(capture.lectureId);
      if (!lecture) {
        throw new TypeError(`Lecture inbox capture references missing lecture: ${capture.lectureId}`);
      }
      const subject = subjectMap.get(lecture.subjectId);
      if (!subject) {
        throw new TypeError(`Lecture inbox lecture references missing subject: ${lecture.subjectId}`);
      }
      const resolution = resolutionByCapture.get(capture.id) ?? null;
      if (resolution && resolution.outcome !== "inbox") return null;
      if (normalizedLectureId && capture.lectureId !== normalizedLectureId) return null;
      if (normalizedSubjectId && lecture.subjectId !== normalizedSubjectId) return null;
      return {
        kind: "lecture-inbox-item",
        captureId: capture.id,
        lectureId: lecture.id,
        subjectId: subject.id,
        captureKind: capture.captureKind,
        text: capture.text,
        capturedAt: capture.capturedAt,
        state: resolution ? "kept" : "unprocessed",
        resolutionId: resolution?.id ?? null,
        lectureTitle: lecture.title,
        subjectTitle: subject.title,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.capturedAt.localeCompare(left.capturedAt)
      || left.captureId.localeCompare(right.captureId)
    ));
}

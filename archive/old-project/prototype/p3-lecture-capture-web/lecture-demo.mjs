const PROFILE_KEY = "studio5-lecture-capture-gate";

async function findOrCreate(repository, {
  list,
  find,
  create,
}) {
  const existing = (await list()).find(find);
  return existing ?? create();
}

export async function createLectureCaptureDemo(repository, {
  now = Date.now(),
} = {}) {
  if (!repository || typeof repository.createLectureCapture !== "function") {
    throw new TypeError("Lecture Capture demo requires an AcademicRepository");
  }

  await repository.initialize();
  const profile = await findOrCreate(repository, {
    list: () => repository.listSubjectProfiles(),
    find: (candidate) => candidate.key === PROFILE_KEY,
    create: () => repository.createSubjectProfile({
      key: PROFILE_KEY,
      label: "Lecture Capture",
    }),
  });
  const year = await findOrCreate(repository, {
    list: () => repository.listAcademicYears(),
    find: (candidate) => candidate.label === "Studio5 Demo",
    create: () => repository.createAcademicYear({
      label: "Studio5 Demo",
      startDate: "2026-07-01",
      endDate: "2027-06-30",
    }),
  });
  const semester = await findOrCreate(repository, {
    list: () => repository.listSemesters({ academicYearId: year.id }),
    find: (candidate) => candidate.order === 1,
    create: () => repository.createSemester({
      academicYearId: year.id,
      label: "الفصل التجريبي",
      order: 1,
      startDate: "2026-07-01",
      endDate: "2026-12-31",
    }),
  });
  const subject = await findOrCreate(repository, {
    list: () => repository.listSubjects({ semesterId: semester.id }),
    find: (candidate) => candidate.subjectProfileId === profile.id,
    create: () => repository.createSubject({
      semesterId: semester.id,
      subjectProfileId: profile.id,
      title: "مادة تجريبية",
      color: "#255747",
    }),
  });
  const lectures = await repository.listLectures({ subjectId: subject.id });
  const lecture = lectures.find((candidate) => candidate.title === "المحاضرة الحالية")
    ?? await repository.createLecture({
      subjectId: subject.id,
      title: "المحاضرة الحالية",
      startsAt: "2026-07-25T09:00:00+03:00",
      endsAt: "2026-07-25T11:00:00+03:00",
      status: "planned",
    });
  let captureClock = Number(now);

  return {
    year,
    semester,
    subject,
    lecture,
    async capture({ kind, text }) {
      captureClock = Math.max(captureClock + 1, Date.now());
      return repository.createLectureCapture({
        lectureId: lecture.id,
        kind,
        text,
        capturedAt: new Date(captureClock).toISOString(),
      });
    },
    async listCaptures() {
      return repository.listLectureCaptures({ lectureId: lecture.id });
    },
    async inbox() {
      return repository.buildLectureInbox({ lectureId: lecture.id });
    },
  };
}

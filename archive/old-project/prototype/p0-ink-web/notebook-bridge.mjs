const DEMO_PROFILE_KEY = "studio5-notebook-gate";

function yearDates(now) {
  const year = new Date(now).getUTCFullYear();
  return {
    year,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

async function createDemoPlacement(repository, now) {
  const dates = yearDates(now);
  const academicYear = await repository.createAcademicYear({
    label: `سنة تجربة Studio5 ${dates.year}`,
    startDate: dates.startDate,
    endDate: dates.endDate,
  });
  const semester = await repository.createSemester({
    academicYearId: academicYear.id,
    label: "فصل تجربة Notebook",
    order: 1,
    startDate: dates.startDate,
    endDate: dates.endDate,
  });
  return semester;
}

async function createDemoLecture(repository, subjectId, now) {
  const startsAt = new Date(now);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  return repository.createLecture({
    subjectId,
    title: "جلسة تجربة القلم",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });
}

async function findOrCreateContext(repository, {
  now = Date.now(),
  documentWidth,
  documentHeight,
} = {}) {
  await repository.initialize();
  const profiles = await repository.listSubjectProfiles();
  let profile = profiles.find(({ key }) => key === DEMO_PROFILE_KEY) ?? null;
  let subject = profile
    ? (await repository.listSubjects()).find(
      ({ subjectProfileId }) => subjectProfileId === profile.id,
    ) ?? null
    : null;
  let lecture = subject
    ? (await repository.listLectures({ subjectId: subject.id }))[0] ?? null
    : null;

  if (!profile) {
    profile = await repository.createSubjectProfile({
      key: DEMO_PROFILE_KEY,
      label: "ملف مادة عام لتجربة Notebook",
    });
  }
  if (!subject) {
    const semester = await createDemoPlacement(repository, now);
    subject = await repository.createSubject({
      semesterId: semester.id,
      subjectProfileId: profile.id,
      title: "مساحة الرسم التجريبية",
    });
  }
  if (!lecture) {
    lecture = await createDemoLecture(repository, subject.id, now);
  }

  let notebook = (await repository.listNotebooks({ subjectId: subject.id }))[0] ?? null;
  if (!notebook) {
    notebook = await repository.createNotebook({
      subjectId: subject.id,
      lectureId: lecture?.id ?? null,
      title: "دفتر تجربة القلم",
      template: "blank",
    });
  }

  let inkDocument = (await repository.listInkDocuments({
    notebookId: notebook.id,
  }))[0] ?? null;
  if (!inkDocument) {
    inkDocument = await repository.createInkDocument({
      notebookId: notebook.id,
      title: "لوحة الرسم الرئيسية",
      width: documentWidth,
      height: documentHeight,
    });
  }

  return { inkDocument, lecture, notebook, profile, subject };
}

export async function createNotebookDemo(repository, options = {}) {
  if (!repository || typeof repository.initialize !== "function") {
    throw new TypeError("Notebook demo requires an AcademicRepository");
  }
  const context = await findOrCreateContext(repository, options);

  async function revisions() {
    return repository.listInkRevisions({
      inkDocumentId: context.inkDocument.id,
    });
  }

  async function loadRevision(revisionId) {
    const revision = (await revisions()).find(({ id }) => id === revisionId);
    if (!revision) return null;
    const content = await repository.getInkRevisionContent(revision.id);
    return content
      ? {
        revision,
        strokes: structuredClone(content.snapshot.strokes),
      }
      : null;
  }

  return {
    ...context,
    async revisionCount() {
      return (await revisions()).length;
    },
    async listRevisions() {
      return structuredClone(await revisions());
    },
    loadRevision,
    async save(strokes) {
      const result = await repository.saveInkRevision(context.inkDocument.id, {
        strokes: structuredClone(strokes ?? []),
      });
      return {
        ...result,
        revisionCount: (await revisions()).length,
      };
    },
    async restoreLatest() {
      const available = await revisions();
      const latest = available.at(-1);
      if (!latest) return null;
      return loadRevision(latest.id);
    },
  };
}

export { DEMO_PROFILE_KEY };

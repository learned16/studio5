import { validatePdfFile } from "./library-state.mjs";

const PROFILE_KEY = "studio5-pdf-notes-library";

async function findOrCreate(repository, { list, find, create }) {
  const existing = (await list()).find(find);
  return existing ?? create();
}

export async function createLibraryDemo(repository) {
  if (!repository || typeof repository.ingestFile !== "function") {
    throw new TypeError("Library demo requires an AcademicRepository with file storage");
  }
  await repository.initialize();
  const profile = await findOrCreate(repository, {
    list: () => repository.listSubjectProfiles(),
    find: (candidate) => candidate.key === PROFILE_KEY,
    create: () => repository.createSubjectProfile({
      key: PROFILE_KEY,
      label: "PDF and Notes",
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
      title: "مكتبة المادة التجريبية",
      color: "#285a4a",
    }),
  });

  return {
    repository,
    subject,
    async ingestPdf(file) {
      validatePdfFile(file);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await repository.ingestFile({
        bytes,
        displayName: file.name,
        originalName: file.name,
        mediaType: "application/pdf",
        originalModifiedAt: file.lastModified
          ? new Date(file.lastModified).toISOString()
          : null,
      });
      const links = await repository.listArtifactLinks({
        artifactId: result.artifact.id,
        targetKind: "subject",
        targetId: subject.id,
      });
      if (links.length === 0) {
        await repository.linkArtifact({
          artifactId: result.artifact.id,
          targetKind: "subject",
          targetId: subject.id,
          role: "source",
          label: "PDF محلي",
        });
      }
      return result;
    },
    async listPdfs() {
      const links = await repository.listArtifactLinks({
        targetKind: "subject",
        targetId: subject.id,
      });
      const artifactIds = new Set(links.map((link) => link.artifactId));
      const artifacts = (await repository.listFileArtifacts())
        .filter((artifact) => artifactIds.has(artifact.id));
      return Promise.all(artifacts.map(async (artifact) => {
        const versions = await repository.listFileVersions({ artifactId: artifact.id });
        const version = versions.at(-1) ?? null;
        return { artifact, version };
      }));
    },
    async openPdf(artifactId) {
      const versions = await repository.listFileVersions({ artifactId });
      const version = versions.at(-1);
      if (!version || version.mediaType !== "application/pdf") return null;
      const content = await repository.getFileContent(version.id);
      if (!content) return null;
      await repository.recordResourceOpened("file-artifact", artifactId);
      return { version, content };
    },
    createNote(input) {
      return repository.createNote({
        ...input,
        subjectId: subject.id,
      });
    },
    listNotes(artifactId = null) {
      return repository.listNotes({
        subjectId: subject.id,
        artifactId,
      });
    },
  };
}

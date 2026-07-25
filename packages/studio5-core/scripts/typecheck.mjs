const modules = await Promise.all([
  import("../src/ids.mjs"),
  import("../src/model.mjs"),
  import("../src/schema.mjs"),
  import("../src/store.mjs"),
  import("../src/local-database.mjs"),
  import("../src/indexeddb-driver.mjs"),
  import("../src/academic-repository.mjs"),
]);

const requiredExports = [
  ["createStableId", "isStableId", "assertStableId"],
  [
    "createAcademicYear",
    "createSemester",
    "createCapabilityPack",
    "createSubjectProfile",
    "createSubject",
  ],
  ["CORE_SCHEMA_VERSION", "createEmptySnapshot", "migrateSnapshot", "validateSnapshot"],
  ["CoreStore", "CoreRelationError"],
  ["CoreLocalDatabase", "CorePersistenceError", "CoreRecoveryError"],
  ["IndexedDbCoreDriver", "INDEXED_DB_VERSION"],
  ["AcademicRepository", "AcademicRepositoryRecoveryRequiredError"],
];

for (let index = 0; index < modules.length; index += 1) {
  for (const name of requiredExports[index]) {
    if (!(name in modules[index])) throw new Error(`Missing core export: ${name}`);
  }
}

console.log("Studio5 core module contract check passed");

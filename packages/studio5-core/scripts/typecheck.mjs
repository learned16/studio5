const modules = await Promise.all([
  import("../src/ids.mjs"),
  import("../src/model.mjs"),
  import("../src/schema.mjs"),
  import("../src/store.mjs"),
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
];

for (let index = 0; index < modules.length; index += 1) {
  for (const name of requiredExports[index]) {
    if (!(name in modules[index])) throw new Error(`Missing core export: ${name}`);
  }
}

console.log("Studio5 core module contract check passed");

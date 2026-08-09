export const destinations = Object.freeze([
  Object.freeze({ id: "today", label: "Today", glyph: "T" }),
  Object.freeze({ id: "study", label: "Study", glyph: "S" }),
  Object.freeze({ id: "projects", label: "Projects", glyph: "P" }),
  Object.freeze({ id: "practice", label: "Practice", glyph: "R" }),
  Object.freeze({ id: "library", label: "Library", glyph: "L" }),
]);

const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));

export function routeHash(destinationId) {
  if (!destinationById.has(destinationId)) return "#/today";
  return `#/${destinationId}`;
}

export function routeFromHash(hash) {
  const destinationId = hash.replace(/^#\/?/, "").split(/[/?]/, 1)[0].toLowerCase();
  return destinationById.get(destinationId) ?? destinations[0];
}

export function routeFromPathname(pathname) {
  const destinationId = pathname.split("/").filter(Boolean).at(-1)?.toLowerCase() ?? "today";
  return destinationById.get(destinationId) ?? destinations[0];
}

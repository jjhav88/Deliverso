/**
 * TEMPORARY HOME DEMO DATA
 * Replace with repository/query when catalog persistence is implemented.
 *
 * Conceptual presentation themes for the Home. Not database entities,
 * licensed properties, or a definitive universe taxonomy.
 */

export const universeDemo = [
  { id: "celebrations" },
  { id: "fantasy" },
  { id: "elegance" },
  { id: "custom" },
] as const;

export type UniverseDemoId = (typeof universeDemo)[number]["id"];

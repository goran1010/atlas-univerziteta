import type { ParentCrumb } from "../schemas/pendingChange";

// Levels with their own detail page; programs and tracks have none.
const DETAIL_PATHS: Partial<Record<ParentCrumb["targetType"], string>> = {
  UNIVERSITY: "/universities",
  FACULTY: "/faculties",
};

// The detail page for an existing entity, or undefined for levels without
// one - so breadcrumb segments can link when a page exists.
function entityDetailPath(
  targetType: string,
  targetId: number | null | undefined,
): string | undefined {
  if (targetId == null) return undefined;
  const path = DETAIL_PATHS[targetType as ParentCrumb["targetType"]];
  return path ? `${path}/${targetId.toString()}` : undefined;
}

export { DETAIL_PATHS, entityDetailPath };

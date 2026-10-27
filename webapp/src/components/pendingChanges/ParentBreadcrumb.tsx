import { Link } from "react-router";

import type { ParentCrumb } from "../../schemas/pendingChange";

const DETAIL_PATHS: Partial<Record<ParentCrumb["targetType"], string>> = {
  UNIVERSITY: "/universities",
  FACULTY: "/faculties",
};

const linkClassName =
  "underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors";

// The detail page for an existing entity, or undefined for levels without
// one (programs, tracks) - so the final breadcrumb segment can link too.
function entityDetailPath(
  targetType: string,
  targetId: number | null | undefined,
): string | undefined {
  if (targetId == null) return undefined;
  const path = DETAIL_PATHS[targetType as ParentCrumb["targetType"]];
  return path ? `${path}/${targetId.toString()}` : undefined;
}

interface ParentBreadcrumbProps {
  crumbs: ParentCrumb[];
  // The changed entity itself, shown as the final segment
  current?: string | null;
  // when set, the final segment links to the entity's detail page
  currentPath?: string | undefined;
}

function ParentBreadcrumb({
  crumbs,
  current,
  currentPath,
}: ParentBreadcrumbProps) {
  if (crumbs.length === 0 && !current) return null;

  return (
    <p className="text-xs text-(--text-muted) px-2 py-1 text-center">
      {crumbs.map((crumb, index) => {
        const path = DETAIL_PATHS[crumb.targetType];

        return (
          <span key={`${crumb.targetType}-${crumb.id.toString()}`}>
            {index > 0 && " › "}
            {path ? (
              <Link
                to={`${path}/${crumb.id.toString()}`}
                className={linkClassName}
              >
                {crumb.name}
              </Link>
            ) : (
              crumb.name
            )}
          </span>
        );
      })}
      {current && (
        <span className="font-medium text-(--text-primary)">
          {crumbs.length > 0 && " › "}
          {currentPath ? (
            <Link to={currentPath} className={linkClassName}>
              {current}
            </Link>
          ) : (
            current
          )}
        </span>
      )}
    </p>
  );
}

export { ParentBreadcrumb, entityDetailPath };

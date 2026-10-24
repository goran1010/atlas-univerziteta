import { Link } from "react-router";

import type { ParentCrumb } from "../../schemas/pendingChange";

const DETAIL_PATHS: Partial<Record<ParentCrumb["targetType"], string>> = {
  UNIVERSITY: "/universities",
  FACULTY: "/faculties",
};

const linkClassName =
  "underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors";

interface ParentBreadcrumbProps {
  crumbs: ParentCrumb[];
  // The changed entity itself, shown as the final, non-linked segment
  current?: string | null;
}

function ParentBreadcrumb({ crumbs, current }: ParentBreadcrumbProps) {
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
          {current}
        </span>
      )}
    </p>
  );
}

export { ParentBreadcrumb };

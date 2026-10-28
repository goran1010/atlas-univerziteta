import { DETAIL_PATHS } from "../../utils/entityDetailPath";
import { TextLink } from "../sharedComponents/TextLink";

import type { ParentCrumb } from "../../schemas/pendingChange";

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
              <TextLink to={`${path}/${crumb.id.toString()}`}>
                {crumb.name}
              </TextLink>
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
            <TextLink to={currentPath}>{current}</TextLink>
          ) : (
            current
          )}
        </span>
      )}
    </p>
  );
}

export { ParentBreadcrumb };

import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

import type { ValidationIssue } from "./utils/validateTreePayload";

function ValidationIssueList({ issues }: { issues: ValidationIssue[] }) {
  const { t } = use(RootContext);

  if (issues.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-1 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 sm:p-3"
    >
      <p className="text-xs font-semibold text-red-800 dark:text-red-300">
        {t("contribution.tree.validationErrors")}
      </p>
      <ul className="text-xs font-mono text-red-700 dark:text-red-300 flex flex-col gap-0.5">
        {issues.map((issue, index) => (
          <li key={`${issue.path}-${String(index)}`} className="break-all">
            {issue.path ? `${issue.path}: ` : ""}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ValidationIssueList };

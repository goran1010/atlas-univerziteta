import type { ReactNode } from "react";

import { LEVEL_STRIP } from "../../utils/levelColors";
import type { EntityLevel } from "../../utils/levelColors";

function ResultCard({
  children,
  level,
}: {
  children: ReactNode;
  level?: EntityLevel;
}) {
  return (
    <li
      className={`border border-(--border-color) rounded-lg overflow-hidden bg-(--surface-2) hover:bg-(--hover-surface) transition-colors ${
        level ? LEVEL_STRIP[level] : ""
      }`}
    >
      <div className="p-2 sm:p-4">{children}</div>
    </li>
  );
}

export { ResultCard };

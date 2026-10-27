import { ChevronDownIcon } from "../sharedComponents/icons";
import { LEVEL_BADGE } from "../../utils/levelColors";

import type { TFunction } from "../../types";
import type { EntityLevel } from "../../utils/levelColors";

// the content of a collapsed box's expander: looks like a control (border,
// chevron) and carries the level hue, not plain text
function ExpandHintChip({
  count,
  level,
  t,
}: {
  count?: number | undefined;
  level?: EntityLevel | undefined;
  t: TFunction;
}) {
  const colors = level
    ? LEVEL_BADGE[level]
    : "bg-(--surface-alt) text-(--accent-text)";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-(--border-color)/60 ${colors}`}
    >
      <ChevronDownIcon className="-rotate-90" />
      {count != null && `${String(count)} `}
      {t("universitiesPage.hiddenTapToExpand")}
    </span>
  );
}

function CollapseToggle({
  collapsed,
  onClick,
  t,
  className = "",
}: {
  collapsed: boolean;
  onClick: () => void;
  t: TFunction;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={!collapsed}
      className={`flex items-center gap-1 px-3 py-2 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-md cursor-pointer transition-all bg-(--surface-1) text-(--accent-text) border border-(--border-color) shadow-(--card-shadow-soft) hover:bg-(--hover-surface) hover:shadow-(--card-shadow) active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) ${className}`}
    >
      <ChevronDownIcon
        className={`text-[10px] transition-transform ${collapsed ? "-rotate-90" : ""}`}
      />
      {collapsed
        ? t("universitiesPage.expand")
        : t("universitiesPage.collapse")}
    </button>
  );
}

export { CollapseToggle, ExpandHintChip };

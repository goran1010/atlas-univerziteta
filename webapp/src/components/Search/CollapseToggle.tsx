import { ChevronDownIcon } from "../sharedComponents/icons";

import type { TFunction } from "../../types";

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

export { CollapseToggle };

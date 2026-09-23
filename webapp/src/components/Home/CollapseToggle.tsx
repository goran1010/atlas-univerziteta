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
      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--hover-surface) rounded-md cursor-pointer transition-colors ${className}`}
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

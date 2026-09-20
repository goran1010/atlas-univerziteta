import { ChevronDownIcon } from "../sharedComponents/icons";
import { useState, use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";

function ResultGroup({
  label,
  children,
  collapsible = false,
  count,
}: {
  label: string;
  children: ReactNode;
  collapsible?: boolean;
  count?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = use(RootContext);

  return (
    <div className="relative mt-2 border border-(--border-color)/30 rounded-xl overflow-x-clip p-1 pt-3 sm:p-3 sm:pt-4 bg-(--surface-1)/40">
      <div className="absolute -top-2.5 left-3 right-3 flex items-center justify-between">
        <span className="px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide rounded bg-(--surface-alt) text-(--accent-text) leading-tight border border-(--border-color)/40">
          {label}
          {count != null && (
            <span className="ml-1 px-1 rounded-full bg-(--hover-surface) text-(--accent-text)">
              {count}
            </span>
          )}
        </span>
        {collapsible && (
          <button
            type="button"
            onClick={() => {
              setCollapsed((prev) => !prev);
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-[0.7rem] font-medium rounded bg-(--surface-alt) text-(--text-secondary) hover:text-(--text-primary) border border-(--border-color)/40 cursor-pointer transition-colors leading-tight"
          >
            <ChevronDownIcon
              className={`text-[10px] transition-transform ${collapsed ? "-rotate-90" : ""}`}
            />
            {collapsed
              ? t("universitiesPage.expand")
              : t("universitiesPage.collapse")}
          </button>
        )}
      </div>
      {!collapsed && (
        <ul className="flex flex-col gap-2 list-none">{children}</ul>
      )}
    </div>
  );
}

export { ResultGroup };

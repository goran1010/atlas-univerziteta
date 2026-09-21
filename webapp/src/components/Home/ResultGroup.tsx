import { useState, use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { CollapseToggle } from "./CollapseToggle";

function ResultGroup({
  label,
  children,
  collapsible = false,
  defaultCollapsed = false,
  count,
}: {
  label: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  count?: number;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
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
          <CollapseToggle
            collapsed={collapsed}
            onClick={() => {
              setCollapsed((prev) => !prev);
            }}
            t={t}
            className="bg-(--surface-1)"
          />
        )}
      </div>
      {!collapsed && (
        <ul className="flex flex-col gap-2 list-none">{children}</ul>
      )}
    </div>
  );
}

export { ResultGroup };

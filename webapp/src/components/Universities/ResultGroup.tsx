import { ChevronDownIcon } from "../sharedComponents/icons";
import { useState, type ReactNode } from "react";

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

  return (
    <div className="relative mt-2 border border-(--border-color)/30 rounded-xl overflow-x-clip p-1 pt-3 sm:p-3 sm:pt-4 bg-(--surface-1)/40">
      {collapsible ? (
        <button
          type="button"
          onClick={() => {
            setCollapsed((prev) => !prev);
          }}
          className="absolute -top-2.5 left-3 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide rounded bg-(--surface-alt) text-(--accent-text) leading-tight border border-(--border-color)/40 cursor-pointer flex items-center gap-1 transition-transform active:scale-[0.97]"
        >
          <span
            className="text-[0.6rem] transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          >
            <ChevronDownIcon />
          </span>
          {label}
          {count != null && (
            <span className="px-1 rounded-full bg-(--hover-surface) text-(--accent-text)">
              {count}
            </span>
          )}
        </button>
      ) : (
        <span className="absolute -top-2.5 left-3 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide rounded bg-(--surface-alt) text-(--accent-text) leading-tight border border-(--border-color)/40">
          {label}
        </span>
      )}
      {!collapsed && (
        <ul className="flex flex-col gap-2 list-none">{children}</ul>
      )}
    </div>
  );
}

export { ResultGroup };

import { useState, use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { CollapseToggle, ExpandHintChip } from "./CollapseToggle";
import { LEVEL_BADGE } from "../../utils/levelColors";

import type { EntityLevel } from "../../utils/levelColors";

function LabelPill({
  label,
  count,
  level,
}: {
  label: string;
  count?: number | undefined;
  level?: EntityLevel | undefined;
}) {
  const colors = level
    ? LEVEL_BADGE[level]
    : "bg-(--surface-alt) text-(--accent-text)";
  return (
    <span
      className={`px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide rounded leading-tight border border-(--border-color)/40 min-w-0 ${colors}`}
    >
      {label}
      {count != null && (
        <span className="ml-1 px-1 rounded-full bg-(--surface-1)/70">
          {count}
        </span>
      )}
    </span>
  );
}

function ResultGroup({
  label,
  children,
  collapsible = false,
  defaultCollapsed = false,
  count,
  level,
}: {
  label: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  count?: number;
  level?: EntityLevel;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { t } = use(RootContext);

  // collapsed, the whole box is one button: border to border expands it
  if (collapsed) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={() => {
          setCollapsed(false);
        }}
        className="relative block w-full mt-3 border border-(--border-color)/30 rounded-xl overflow-x-clip pt-6 sm:pt-5 bg-(--surface-1)/40 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--hover-surface) cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
      >
        <span className="absolute -top-3 left-3 flex items-center">
          <LabelPill label={label} count={count} level={level} />
        </span>
        <span className="flex w-full justify-center py-1.5">
          <ExpandHintChip count={count} level={level} t={t} />
        </span>
      </button>
    );
  }

  return (
    <div className="relative mt-3 border border-(--border-color)/30 rounded-xl overflow-x-clip p-1 pt-7 sm:p-3 sm:pt-6 bg-(--surface-1)/40">
      <div className="absolute -top-3 left-3 right-3 flex items-center justify-between gap-1.5">
        <LabelPill label={label} count={count} level={level} />
        {collapsible && (
          <CollapseToggle
            collapsed={collapsed}
            onClick={() => {
              setCollapsed(true);
            }}
            t={t}
            className="shrink-0"
          />
        )}
      </div>
      <ul className="flex flex-col gap-2 list-none">{children}</ul>
    </div>
  );
}

export { ResultGroup };

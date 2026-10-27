import { useState, use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { CollapseToggle } from "./CollapseToggle";

function LabelPill({ label, count }: { label: string; count?: number }) {
  return (
    <span className="px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide rounded bg-(--surface-alt) text-(--accent-text) leading-tight border border-(--border-color)/40 min-w-0">
      {label}
      {count != null && (
        <span className="ml-1 px-1 rounded-full bg-(--hover-surface) text-(--accent-text)">
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
}: {
  label: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  count?: number;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { t } = use(RootContext);

  // collapsed, the whole box is one button: border to border expands it
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => {
          setCollapsed(false);
        }}
        className="relative block w-full mt-3 border border-(--border-color)/30 rounded-xl overflow-x-clip pt-6 sm:pt-5 bg-(--surface-1)/40 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--hover-surface) cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
      >
        <span className="absolute -top-3 left-3 flex items-center">
          <LabelPill label={label} count={count} />
        </span>
        <span className="block w-full py-2 text-xs">
          {count != null && `${String(count)} `}
          {t("universitiesPage.hiddenTapToExpand")}
        </span>
      </button>
    );
  }

  return (
    <div className="relative mt-3 border border-(--border-color)/30 rounded-xl overflow-x-clip p-1 pt-7 sm:p-3 sm:pt-6 bg-(--surface-1)/40">
      <div className="absolute -top-3 left-3 right-3 flex items-center justify-between gap-1.5">
        <LabelPill label={label} count={count} />
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

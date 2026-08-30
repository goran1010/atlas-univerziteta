import type { ReactNode } from "react";

/**
 * Visual wrapper for a group of result cards — a bordered container
 * with a label chip in the top-left corner.
 */
function ResultGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative mt-2 border border-(--border-color)/30 rounded-xl p-1 pt-3 sm:p-3 sm:pt-4 bg-(--surface-1)/40">
      <span className="absolute -top-2.5 left-3 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide rounded bg-blue-100 text-(--accent) leading-tight border border-(--border-color)/40 dark:bg-blue-950">
        {label}
      </span>
      <ul className="flex flex-col gap-2 list-none">{children}</ul>
    </div>
  );
}

export { ResultGroup };

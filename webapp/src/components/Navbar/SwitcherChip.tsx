import { ChevronDownIcon } from "../sharedComponents/icons";

import type { ReactNode, SelectHTMLAttributes } from "react";

interface SwitcherChipProps extends SelectHTMLAttributes<HTMLSelectElement> {
  face: ReactNode;
  children: ReactNode;
}

// A native select is as wide as its longest option, so the chip shows a
// compact face and the real select sits invisibly on top of it: clicks,
// keyboard use, the option list, and the accessible name all stay native.
// Its 16px text keeps iOS Safari from zooming in on tap, and its own
// background and text colors are what the opened option list is drawn with.
function SwitcherChip({ face, children, ...selectProps }: SwitcherChipProps) {
  return (
    <div className="relative inline-flex h-9.5 flex-1 items-center justify-center rounded-md border border-(--border-input) bg-(--surface-1) px-2 text-sm sm:flex-none sm:px-2.5 font-semibold text-(--text-primary) shadow-(--card-shadow-soft) hover:shadow-(--card-shadow) has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-(--focus-ring)">
      <span aria-hidden="true" className="flex items-center gap-1 sm:gap-1.5">
        {face}
        <ChevronDownIcon className="text-xs text-(--text-muted)" />
      </span>
      <select
        {...selectProps}
        className="absolute inset-0 h-full w-full cursor-pointer bg-(--surface-1) text-base text-(--text-primary) opacity-0"
      >
        {children}
      </select>
    </div>
  );
}

export { SwitcherChip };

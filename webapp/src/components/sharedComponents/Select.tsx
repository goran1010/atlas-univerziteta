import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  // single-line and tighter, for the navbar
  compact?: boolean;
  children: React.ReactNode;
}

function Select({
  children,
  className = "",
  compact = false,
  ...props
}: SelectProps) {
  const sizeClasses = compact
    ? "truncate pl-2 pr-7 bg-position-[right_0.5rem_center]"
    : "whitespace-normal wrap-break-word pl-3 pr-9 bg-position-[right_0.75rem_center]";

  return (
    <select
      className={`flex-1 cursor-pointer appearance-none text-center h-full sm:min-w-33 w-full sm:w-auto relative flex items-center
          justify-center rounded-md text-sm font-semibold bg-(--surface-1) text-(--text-primary) border border-(--border-input) shadow-(--card-shadow-soft)
          hover:shadow-(--card-shadow) color-(--text-primary) py-2 bg-(image:--select-arrow) bg-no-repeat bg-size-[1rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)
          open:rounded-b-none max-w-68 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };

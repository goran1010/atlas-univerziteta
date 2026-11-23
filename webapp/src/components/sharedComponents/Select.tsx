import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

function Select({ children, className = "", ...props }: SelectProps) {
  return (
    <select
      className={`flex-1 cursor-pointer appearance-none whitespace-normal text-center wrap-break-word h-full sm:min-w-33 w-full sm:w-auto relative flex items-center 
          justify-center rounded-md text-sm font-semibold bg-(--surface-1) text-(--text-primary) border border-(--border-input) shadow-(--card-shadow-soft) 
          hover:shadow-(--card-shadow) color-(--text-primary) pl-3 pr-9 py-2 bg-(image:--select-arrow) bg-no-repeat bg-size-[1rem] bg-position-[right_0.75rem_center] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)
          open:rounded-b-none max-w-68 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };

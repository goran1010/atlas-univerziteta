import { Spinner } from "../../utils/Spinner";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    "primary" | "secondary" | "success" | "danger" | "update" | "warning";
  loading?: boolean;
}

function Button({
  children,
  className = "",
  type = "button",
  loading = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "bg-(--accent) text-slate-50 tracking-[0.01em] enabled:hover:bg-(--accent-hover) enabled:hover:shadow-[0_10px_20px_rgba(37,99,235,0.25)] enabled:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) disabled:bg-(--accent-disabled) disabled:text-(--disabled-text) disabled:shadow-none disabled:transform-none aria-disabled:bg-(--accent-disabled) aria-disabled:text-(--disabled-text) aria-disabled:shadow-none aria-disabled:transform-none",
    secondary:
      "bg-(--surface-1) text-(--text-primary) border border-(--border-color) shadow-(--card-shadow-soft) enabled:hover:bg-(--hover-surface) enabled:hover:shadow-(--card-shadow) enabled:active:scale-[0.98] disabled:bg-(--surface-3) disabled:text-(--disabled-text)",
    success:
      "bg-green-700 text-green-50 shadow-[0_8px_16px_rgba(21,128,61,0.22)] enabled:hover:bg-green-800 disabled:bg-green-400 disabled:text-green-100",
    danger:
      "bg-red-700 text-red-50 shadow-[0_8px_16px_rgba(185,28,28,0.22)] enabled:hover:bg-red-800 disabled:bg-red-500 disabled:text-red-100",
    update:
      "bg-blue-600 text-blue-50 shadow-[0_8px_16px_rgba(37,99,235,0.22)] enabled:hover:bg-blue-700 disabled:bg-blue-300 disabled:text-blue-100",
    warning:
      "bg-amber-700 text-amber-50 shadow-[0_8px_16px_rgba(202,138,4,0.2)] enabled:hover:bg-amber-800 disabled:bg-amber-500 disabled:text-amber-100",
  };

  const variantClass = variantClasses[variant] || variantClasses.primary;
  const baseClassName =
    "w-full relative inline-flex items-center justify-center rounded-md p-2 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed transition-all duration-150";

  return (
    <button
      type={type}
      className={`${variantClass} ${baseClassName} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      <div
        className={`h-full w-full flex justify-center items-center absolute`}
      >
        {loading && <Spinner />}
      </div>
      {/* invisible, not unmounted - the button keeps its width while loading */}
      <span className={loading ? "invisible" : "visible"}>{children}</span>
    </button>
  );
}

export { Button };

import { Spinner } from "../../utils/Spinner";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "update"
    | "warning"
    | "ghost";
  loading?: boolean;
}

const DISABLED =
  "disabled:opacity-45 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed";

function Button({
  children,
  className = "",
  type = "button",
  loading = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: `border-2 border-(--accent)/60 text-(--text-primary) tracking-[0.01em] enabled:hover:bg-(--accent)/10 enabled:active:scale-[0.98] ${DISABLED}`,
    secondary: `bg-(--surface-1) text-(--text-primary) border-2 border-(--border-color) shadow-(--card-shadow-soft) enabled:hover:bg-(--hover-surface) enabled:hover:shadow-(--card-shadow) enabled:active:scale-[0.98] ${DISABLED}`,
    success: `border-2 border-green-600/60 dark:border-green-400/50 text-(--text-primary) enabled:hover:bg-green-600/10 ${DISABLED}`,
    danger: `border-2 border-red-600/60 dark:border-red-400/50 text-(--text-primary) enabled:hover:bg-red-600/10 ${DISABLED}`,
    update: `border-2 border-yellow-500/60 dark:border-yellow-400/50 text-(--text-primary) enabled:hover:bg-yellow-500/10 ${DISABLED}`,
    warning: `border-2 border-amber-600/60 dark:border-amber-400/50 text-(--text-primary) enabled:hover:bg-amber-600/10 ${DISABLED}`,
    ghost: `text-(--text-secondary) enabled:hover:text-(--text-primary) enabled:hover:bg-(--hover-surface) ${DISABLED}`,
  };

  const variantClass = variantClasses[variant] || variantClasses.primary;
  const baseClassName =
    "w-full relative inline-flex items-center justify-center rounded-md p-2 text-sm font-semibold cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)";

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

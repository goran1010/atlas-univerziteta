import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

function Input({ className = "", ...props }: InputProps) {
  const baseStyles =
    "block w-full px-3 py-2 rounded-md shadow-sm bg-(--surface-2) text-(--text-primary) border border-(--border-input) " +
    "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.28)] placeholder:text-(--text-secondary) transition duration-150 focus:border-(--accent) " +
    "focus:outline-none focus:ring-2 focus:ring-(--focus-ring) disabled:bg-(--surface-3) disabled:text-(--disabled-text) disabled:cursor-not-allowed " +
    "disabled:opacity-85 " +
    "sm:text-sm user-invalid:border-red-500 focus:user-invalid:ring-red-500 focus:user-invalid:border-red-500 " +
    "dark:user-invalid:border-red-500 dark:focus:user-invalid:ring-red-500 dark:focus:user-invalid:border-red-500";

  return <input className={`${baseStyles} ${className}`} {...props} />;
}

export { Input };

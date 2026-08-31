import type { ButtonHTMLAttributes } from "react";

interface ButtonNavbarProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

function ButtonNavbar({
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonNavbarProps) {
  return (
    <button
      type={type}
      className={`min-w-20 w-full relative inline-flex items-center justify-center rounded-md p-2 text-sm transition transform hover:cursor-pointer
        bg-(--surface-1) text-(--text-primary) border border-(--border-color) shadow-(--card-shadow-soft) font-semibold
        hover:bg-(--hover-surface) hover:shadow-(--card-shadow) active:scale-[0.98]
        disabled:cursor-not-allowed
         ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export { ButtonNavbar };

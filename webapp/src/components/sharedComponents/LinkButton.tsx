import { Link } from "react-router";
import type { ReactNode } from "react";

const baseClassName =
  "border-2 rounded-lg px-4 py-2 transition-colors font-medium text-center text-(--text-primary) hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:bg-(--hover-surface)";

function LinkButton({
  to,
  className = "",
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${baseClassName} ${className}`}>
      {children}
    </Link>
  );
}

export { LinkButton };

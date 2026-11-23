import { Link } from "react-router";

import type { ReactNode } from "react";

// the app-wide inline text link style, shared with ExternalLink
const textLinkClassName =
  "underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors";

// for the name heading a card or list entry: it already reads as the entry's
// name, so the underline only shows on hover and keyboard focus
const titleLinkClassName =
  "underline-offset-3 decoration-2 hover:underline focus-visible:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors";

function TextLink({
  to,
  variant = "inline",
  className = "",
  onClick,
  children,
}: {
  to: string;
  variant?: "inline" | "title";
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const variantClassName =
    variant === "title" ? titleLinkClassName : textLinkClassName;

  return (
    <Link
      to={to}
      className={`${variantClassName} ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export { TextLink, textLinkClassName };

import { Link } from "react-router";

import type { ReactNode } from "react";

// the app-wide inline text link style, shared with ExternalLink
const textLinkClassName =
  "underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors";

function TextLink({
  to,
  className = "",
  onClick,
  children,
}: {
  to: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`${textLinkClassName} ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export { TextLink, textLinkClassName };

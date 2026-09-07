import { use } from "react";
import type { ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";

const baseClassName =
  "underline underline-offset-3 decoration-1 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) rounded-sm";

function ExternalLink({
  href,
  newTab = true,
  className = "",
  children,
}: {
  href: string;
  newTab?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { t } = use(RootContext);

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={`${baseClassName} ${className}`}
    >
      {children}
      {newTab && (
        <span className="sr-only">{` ${t("links.opensInNewTab")}`}</span>
      )}
    </a>
  );
}

export { ExternalLink };

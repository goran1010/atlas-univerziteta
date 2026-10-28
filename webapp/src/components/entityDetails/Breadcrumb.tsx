import { use } from "react";
import { TextLink } from "../sharedComponents/TextLink";
import { RootContext } from "../../contextData/RootContext";
import { ChevronDownIcon } from "../sharedComponents/icons";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = use(RootContext);
  return (
    <nav
      aria-label={t("nav.breadcrumb")}
      className="text-sm text-(--text-muted) mb-4"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronDownIcon className="text-[10px] -rotate-90" />}
            {item.to ? (
              <TextLink to={item.to}>{item.label}</TextLink>
            ) : (
              <span className="text-(--text-primary) font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { Breadcrumb };

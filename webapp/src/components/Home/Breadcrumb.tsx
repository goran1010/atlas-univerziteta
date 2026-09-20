import { Link } from "react-router";
import { ChevronDownIcon } from "../sharedComponents/icons";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-(--text-muted) mb-4">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronDownIcon className="text-[10px] -rotate-90" />}
            {item.to ? (
              <Link
                to={item.to}
                className="underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.label}
              </Link>
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

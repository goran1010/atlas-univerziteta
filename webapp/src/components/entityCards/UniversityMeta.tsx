import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { MapPinIcon, TagIcon } from "../sharedComponents/icons";

import type { ReactNode } from "react";
import type { Country, Entity, Ownership } from "../../schemas/domain";

function OwnershipPill({ ownership }: { ownership: Ownership }) {
  const { t } = use(RootContext);
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
        ownership === "PUBLIC"
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
          : "bg-(--surface-alt) text-(--text-secondary)"
      }`}
    >
      {t(`universitiesPage.ownership.${ownership}`)}
    </span>
  );
}

// the city / entity / ownership strip under a university name; callers
// append their own extras (faculty count, founded year) as children
function UniversityMetaRow({
  city,
  country,
  entity,
  ownership,
  className,
  children,
}: {
  city: string;
  country: Country;
  entity?: Entity | undefined;
  ownership: Ownership;
  className: string;
  children?: ReactNode;
}) {
  const { t } = use(RootContext);
  return (
    <div
      className={`flex flex-wrap text-sm text-(--text-secondary) ${className}`}
    >
      <span>
        <MapPinIcon /> {city}
      </span>
      <span>
        <TagIcon /> {t(`universitiesPage.countries.${country}`)}
      </span>
      {entity && (
        <span>
          <TagIcon /> {t(`universitiesPage.entities.${entity}`)}
        </span>
      )}
      <OwnershipPill ownership={ownership} />
      {children}
    </div>
  );
}

export { OwnershipPill, UniversityMetaRow };

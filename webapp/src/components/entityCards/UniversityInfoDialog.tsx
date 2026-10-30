import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import {
  BuildingIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
} from "../sharedComponents/icons";
import { LinkButton } from "../sharedComponents/LinkButton";
import { Dialog } from "../sharedComponents/Dialog";
import { tCount } from "../../utils/pluralize";
import { ContactLinks } from "../entityDetails/ContactLinks";
import { ShareButton } from "../entityDetails/ShareButton";

import type { UniversityListItem } from "../../schemas/university";

function UniversityInfoDialog({
  university,
  open,
  onClose,
  countryLabel,
  entityLabel,
}: {
  university: UniversityListItem;
  open: boolean;
  onClose: () => void;
  countryLabel: string;
  entityLabel: string | undefined;
}) {
  const { t } = use(RootContext);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={university.name}
      headerActions={
        <ShareButton url={`/universities/${university.id.toString()}`} />
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-secondary)">
          <span>
            <MapPinIcon /> {university.city}
          </span>
          <span>
            <TagIcon /> {countryLabel}
          </span>
          {entityLabel && (
            <span>
              <TagIcon /> {entityLabel}
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              university.ownership === "PUBLIC"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                : "bg-(--surface-alt) text-(--text-secondary)"
            }`}
          >
            {t(`universitiesPage.ownership.${university.ownership}`)}
          </span>
          {university.foundedYear && (
            <span>
              <CalendarIcon /> {university.foundedYear}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted)">
          <ContactLinks
            website={university.website}
            address={university.address}
            phone={university.phone}
            email={university.email}
          />
        </div>
        <p className="text-sm text-(--text-muted)">
          <BuildingIcon />{" "}
          <span className="font-bold text-teal-600 dark:text-teal-400">
            {university._count.faculties}
          </span>{" "}
          {tCount(
            t,
            "universitiesPage.facultyCount",
            university._count.faculties,
          )}
        </p>
        <div className="flex justify-center">
          <LinkButton
            to={`/universities/${university.id.toString()}`}
            className="text-sm w-full sm:w-auto"
            onClick={onClose}
          >
            {t("universitiesPage.openFullPage")}
          </LinkButton>
        </div>
      </div>
    </Dialog>
  );
}

export { UniversityInfoDialog };

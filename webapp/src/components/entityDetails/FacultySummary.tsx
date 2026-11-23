import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { TextLink } from "../sharedComponents/TextLink";
import { MapPinIcon, TagIcon } from "../sharedComponents/icons";
import { OwnershipPill } from "../entityCards/UniversityMeta";
import { ContactLinks } from "./ContactLinks";
import { ImproveDataLink } from "./ImproveDataLink";

import type { FacultyDetail } from "../../schemas/university";

// everything the faculty page shows about the faculty itself, shared with
// its "View info" dialog; the study programs stay on the page
function FacultySummary({ faculty }: { faculty: FacultyDetail }) {
  const { t } = use(RootContext);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-(--text-secondary)">
        <TextLink
          to={`/universities/${faculty.university.id.toString()}`}
          className="font-bold"
        >
          {faculty.university.name}
          {faculty.university.acronym && ` (${faculty.university.acronym})`}
        </TextLink>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-secondary)">
        {faculty.city && (
          <span>
            <MapPinIcon /> {faculty.city}
          </span>
        )}
        <span>
          <TagIcon />{" "}
          {t(`universitiesPage.countries.${faculty.university.country}`)}
        </span>
        {faculty.university.entity && (
          <span>
            <TagIcon />{" "}
            {t(`universitiesPage.entities.${faculty.university.entity}`)}
          </span>
        )}
        <OwnershipPill ownership={faculty.university.ownership} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted)">
        <ContactLinks
          website={faculty.website}
          address={faculty.address}
          phone={faculty.phone}
          email={faculty.email}
          dataSourceUrl={faculty.dataSourceUrl}
        />
      </div>
      <ImproveDataLink />
    </div>
  );
}

export { FacultySummary };

import { CalendarIcon } from "../sharedComponents/icons";
import { UniversityMetaRow } from "../entityCards/UniversityMeta";
import { AccreditationInfo } from "./AccreditationInfo";
import { ContactLinks } from "./ContactLinks";
import { ImproveDataLink } from "./ImproveDataLink";

import type { UniversityDetail } from "../../schemas/university";

// everything the university page shows about the university itself, shared
// with its "View info" dialog; the faculties list stays on the page
function UniversitySummary({ university }: { university: UniversityDetail }) {
  return (
    <div className="flex flex-col gap-2">
      <UniversityMetaRow
        city={university.city}
        country={university.country}
        entity={university.entity}
        ownership={university.ownership}
        className="gap-x-4 gap-y-1"
      >
        {university.foundedYear && (
          <span>
            <CalendarIcon /> {university.foundedYear}
          </span>
        )}
      </UniversityMetaRow>
      <AccreditationInfo
        from={university.accreditationFrom}
        to={university.accreditationTo}
        authority={university.authority}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted)">
        <ContactLinks
          website={university.website}
          address={university.address}
          phone={university.phone}
          email={university.email}
          dataSourceUrl={university.dataSourceUrl}
        />
      </div>
      <ImproveDataLink />
    </div>
  );
}

export { UniversitySummary };

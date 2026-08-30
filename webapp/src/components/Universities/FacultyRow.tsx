import { useState } from "react";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { ContactLinks } from "./ContactLinks";
import { ResultGroup } from "./ResultGroup";
import { StudyProgramRow } from "./StudyProgramRow";
import { groupBy } from "./utils/groupBy";

import type { TFunction } from "../../types/i18n";
import type { UniversityDetailFaculty } from "../../schemas/university";

function FacultyRow({
  faculty,
  t,
}: {
  faculty: UniversityDetailFaculty;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="text-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-1.5 px-0.5 sm:px-2">
        <div className="min-w-0">
          <p className="font-semibold">{faculty.name}</p>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-0.5">
            {faculty.studyPrograms.length > 0 && (
              <span>
                🎓 {faculty.studyPrograms.length}{" "}
                {t("universitiesPage.studyPrograms")}
              </span>
            )}
            <ContactLinks
              website={faculty.website}
              address={faculty.address}
              phone={faculty.phone}
              email={faculty.email}
            />
          </div>
        </div>
        {faculty.studyPrograms.length > 0 && (
          <DetailsToggleButton
            expanded={open}
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              setOpen((p) => !p);
            }}
          />
        )}
      </div>
      {open && faculty.studyPrograms.length > 0 && (
        <div className="ml-0.5 sm:ml-4 mt-1 border-l-2 border-indigo-200 dark:border-indigo-700 pl-1.5 sm:pl-3">
          <div className="flex flex-col gap-2">
            {groupBy(faculty.studyPrograms, (sp) =>
              t(`universitiesPage.cycles.${sp.cycle}`),
            ).map((g) => (
              <ResultGroup key={g.key} label={g.key}>
                {g.items.map((sp) => (
                  <StudyProgramRow key={sp.id} program={sp} t={t} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export { FacultyRow };

import { useState } from "react";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { EntityDetailContent } from "./TrackDetailDialog";
import { tCount } from "../../utils/pluralize";
import { ContactLinks } from "./ContactLinks";
import { ResultGroup } from "./ResultGroup";
import { StudyProgramRow } from "./StudyProgramRow";
import { groupBy } from "./utils/groupBy";

import type { TFunction } from "../../types/i18n";
import type {
  UniversityDetail,
  UniversityDetailFaculty,
} from "../../schemas/university";

function FacultyRow({
  faculty,
  t,
  university,
}: {
  faculty: UniversityDetailFaculty;
  t: TFunction;
  university?: UniversityDetail;
}) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasStudyPrograms = faculty.studyPrograms.length > 0;
  const ancestors = university ? { university, faculty } : undefined;

  return (
    <li className="text-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-1.5 px-0.5 sm:px-2">
        <div className="min-w-0">
          <p className="font-semibold">{faculty.name}</p>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-0.5">
            {hasStudyPrograms && (
              <span>
                <span aria-hidden="true">🎓</span>{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {faculty.studyPrograms.length}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.studyProgramCount",
                  faculty.studyPrograms.length,
                )}
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
        {hasStudyPrograms ? (
          <DetailsToggleButton
            expanded={open}
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              setOpen((p) => !p);
            }}
          />
        ) : ancestors ? (
          <Button
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {t("universitiesPage.viewInfo")}
          </Button>
        ) : null}
      </div>
      {open && hasStudyPrograms && (
        <div className="ml-0.5 sm:ml-4 mt-1 border-l-2 border-indigo-200 dark:border-indigo-700 pl-1.5 sm:pl-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-1">
            <span className="text-blue-600 dark:text-blue-400">
              {faculty.studyPrograms.length}
            </span>{" "}
            {tCount(
              t,
              "universitiesPage.studyProgramCount",
              faculty.studyPrograms.length,
            )}
          </p>
          <div className="flex flex-col gap-2">
            {groupBy(faculty.studyPrograms, (sp) =>
              t(`universitiesPage.cycles.${sp.cycle}`),
            ).map((g) => (
              <ResultGroup key={g.key} label={g.key}>
                {g.items.map((sp) => (
                  <StudyProgramRow
                    key={sp.id}
                    program={sp}
                    t={t}
                    university={university}
                    faculty={faculty}
                  />
                ))}
              </ResultGroup>
            ))}
          </div>
        </div>
      )}
      {!hasStudyPrograms && ancestors && (
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
          }}
          title={faculty.name}
        >
          <EntityDetailContent ancestors={ancestors} />
        </Dialog>
      )}
    </li>
  );
}

export { FacultyRow };

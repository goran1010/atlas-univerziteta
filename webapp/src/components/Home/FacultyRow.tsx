import { BookOpenIcon } from "../sharedComponents/icons";
import { useState } from "react";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { LinkButton } from "../sharedComponents/LinkButton";
import { tCount } from "../../utils/pluralize";
import { ContactLinks } from "./ContactLinks";
import { ResultGroup } from "./ResultGroup";
import { StudyProgramRow } from "./StudyProgramRow";
import { groupBy } from "./utils/groupBy";

import type { TFunction } from "../../types";
import type { UniversityDetailFaculty } from "../../schemas/university";

function FacultyRow({
  faculty,
  t,
}: {
  faculty: UniversityDetailFaculty;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);
  const hasStudyPrograms = faculty.studyPrograms.length > 0;

  return (
    <li className="text-sm">
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) return;
          if (hasStudyPrograms) setOpen((p) => !p);
        }}
        className={`py-1.5 px-0.5 sm:px-2 rounded-md transition-colors ${
          hasStudyPrograms ? "cursor-pointer hover:bg-(--hover-surface)" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="font-semibold">{faculty.name}</p>
          {hasStudyPrograms && (
            <p className="text-xs text-(--text-muted) mt-0.5">
              <BookOpenIcon />{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {faculty.studyPrograms.length}
              </span>{" "}
              {tCount(
                t,
                "universitiesPage.studyProgramCount",
                faculty.studyPrograms.length,
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-0.5">
            <ContactLinks
              website={faculty.website}
              address={faculty.address}
              phone={faculty.phone}
              email={faculty.email}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <LinkButton
            to={`/faculties/${faculty.id.toString()}`}
            className="px-3 py-1.5 text-xs border-(--border-color) bg-(--surface-1) shadow-(--card-shadow-soft)"
          >
            {t("universitiesPage.viewInfo")}
          </LinkButton>
          {hasStudyPrograms && (
            <DetailsToggleButton
              expanded={open}
              className="px-3 py-1.5 text-xs"
              onClick={() => {
                setOpen((p) => !p);
              }}
            />
          )}
        </div>
      </div>
      {open && hasStudyPrograms && (
        <div
          className="ml-0.5 sm:ml-4 mt-1 border-l-2 border-indigo-200 dark:border-indigo-700 pl-1.5 sm:pl-3"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
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
                  />
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

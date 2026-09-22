import { BookOpenIcon, MapPinIcon } from "../sharedComponents/icons";
import { useState } from "react";
import { Link } from "react-router";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { tCount } from "../../utils/pluralize";
import { ContactLinks } from "./ContactLinks";
import { ShareButton } from "./ShareButton";
import { ResultGroup } from "./ResultGroup";
import { StudyProgramRow } from "./StudyProgramRow";
import { byCycleDisplayOrder } from "./utils/cycleOrder";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasStudyPrograms = faculty.studyPrograms.length > 0;

  return (
    <li className="text-sm">
      <div
        onClick={(e) => {
          if (e.target instanceof Element && e.target.closest("a, button"))
            return;
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
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {t("universitiesPage.viewInfo")}
          </Button>
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
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title={faculty.name}
        headerActions={
          <ShareButton url={`/faculties/${faculty.id.toString()}`} />
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-secondary)">
            {faculty.city && (
              <span>
                <MapPinIcon /> {faculty.city}
              </span>
            )}
            {hasStudyPrograms && (
              <span className="text-(--text-muted)">
                <BookOpenIcon />{" "}
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
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted)">
            <ContactLinks
              website={faculty.website}
              address={faculty.address}
              phone={faculty.phone}
              email={faculty.email}
            />
          </div>
          <div className="flex justify-center">
            <Link
              to={`/faculties/${faculty.id.toString()}`}
              className="inline-flex items-center justify-center border border-(--border-color) rounded-lg px-4 py-2 text-sm font-medium text-(--text-primary) hover:bg-(--hover-surface) transition-colors"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              {t("universitiesPage.openFullPage")}
            </Link>
          </div>
        </div>
      </Dialog>
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
            {groupBy(byCycleDisplayOrder(faculty.studyPrograms), (sp) =>
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

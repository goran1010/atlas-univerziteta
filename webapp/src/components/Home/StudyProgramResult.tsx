import {
  AwardIcon,
  ClockIcon,
  GraduationCapIcon,
} from "../sharedComponents/icons";
import { Link } from "react-router";
import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";
import { TrackList } from "./TrackList";
import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types";
import type { StudyProgramSearchResult } from "../../schemas/university";

function StudyProgramResult({
  program,
  t,
  contextHint,
}: {
  program: StudyProgramSearchResult;
  t: TFunction;
  contextHint?: string;
}) {
  return (
    <ResultCard>
      <p className="font-bold">
        <Link
          to={`/faculties/${program.faculty.id.toString()}?program=${program.id.toString()}`}
          className="font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {program.name}
        </Link>
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-sm text-(--text-secondary)">
        <span>
          <GraduationCapIcon /> {t(`universitiesPage.cycles.${program.cycle}`)}
        </span>
        {program.ects != null && (
          <span>
            <AwardIcon /> {program.ects} {t("universitiesPage.ects")}
          </span>
        )}
        {program.durationYears != null && (
          <span>
            <ClockIcon /> {program.durationYears}{" "}
            {tCount(t, "universitiesPage.durationYears", program.durationYears)}
          </span>
        )}
      </div>
      <FacultyBreadcrumb faculty={program.faculty} />
      {contextHint && (
        <p className="text-xs italic text-(--text-muted) mt-1">{contextHint}</p>
      )}
      <TrackList tracks={program.tracks} t={t} />
    </ResultCard>
  );
}

export { StudyProgramResult };

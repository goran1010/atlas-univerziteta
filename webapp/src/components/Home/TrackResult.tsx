import {
  AwardIcon,
  BookOpenIcon,
  ClockIcon,
  GraduationCapIcon,
} from "../sharedComponents/icons";
import { Link } from "react-router";
import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";
import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types";
import type { TrackSearchResult } from "../../schemas/university";

function TrackResult({ track, t }: { track: TrackSearchResult; t: TFunction }) {
  return (
    <ResultCard>
      <p className="font-bold">
        <Link
          to={`/faculties/${track.studyProgram.faculty.id.toString()}?program=${track.studyProgram.id.toString()}&track=${track.id.toString()}`}
          className="font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {track.name}
        </Link>
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--text-secondary)">
        <span>
          <GraduationCapIcon />{" "}
          {t(`universitiesPage.cycles.${track.studyProgram.cycle}`)}
        </span>
        {track.durationYears != null && (
          <span>
            <ClockIcon /> {track.durationYears}{" "}
            {tCount(t, "universitiesPage.durationYears", track.durationYears)}
          </span>
        )}
        {track.ects != null && (
          <span>
            <AwardIcon /> {track.ects} {t("universitiesPage.ects")}
          </span>
        )}
      </div>
      <p className="text-sm text-(--text-muted) mt-0.5">
        <BookOpenIcon /> {track.studyProgram.name}
      </p>
      <FacultyBreadcrumb faculty={track.studyProgram.faculty} />
    </ResultCard>
  );
}

export { TrackResult };

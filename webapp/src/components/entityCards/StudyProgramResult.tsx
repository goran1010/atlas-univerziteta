import { TextLink } from "../sharedComponents/TextLink";
import {
  AwardIcon,
  ClockIcon,
  GraduationCapIcon,
} from "../sharedComponents/icons";
import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "../entityDetails/FacultyBreadcrumb";
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
  contextHint?: string | undefined;
}) {
  return (
    <ResultCard level="STUDY_PROGRAM">
      <h3 className="font-bold">
        <TextLink
          to={`/faculties/${program.faculty.id.toString()}?program=${program.id.toString()}`}
          className="font-bold"
        >
          {program.name}
        </TextLink>
      </h3>
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

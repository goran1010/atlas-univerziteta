import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";
import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types/i18n";
import type { TrackSearchResult } from "../../schemas/university";

function TrackResult({ track, t }: { track: TrackSearchResult; t: TFunction }) {
  return (
    <ResultCard>
      <p className="font-bold text-(--text-primary)">{track.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--text-secondary)">
        {track.studyProgram.cycle && (
          <span>
            <span aria-hidden="true">📚</span>{" "}
            {t(`universitiesPage.cycles.${track.studyProgram.cycle}`)}
          </span>
        )}
        {track.durationYears != null && (
          <span>
            <span aria-hidden="true">🕐</span> {track.durationYears}{" "}
            {tCount(t, "universitiesPage.durationYears", track.durationYears)}
          </span>
        )}
        {track.ects != null && (
          <span>
            <span aria-hidden="true">🎓</span> {track.ects}{" "}
            {t("universitiesPage.ects")}
          </span>
        )}
      </div>
      <p className="text-sm text-(--text-muted) mt-0.5">
        <span aria-hidden="true">📋</span> {track.studyProgram.name}
      </p>
      <FacultyBreadcrumb faculty={track.studyProgram.faculty} />
    </ResultCard>
  );
}

export { TrackResult };

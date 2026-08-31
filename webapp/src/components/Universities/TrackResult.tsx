import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";

import type { TFunction } from "../../types/i18n";
import type { TrackSearchResult } from "../../schemas/university";

function TrackResult({ track, t }: { track: TrackSearchResult; t: TFunction }) {
  return (
    <ResultCard>
      <p className="font-bold text-(--text-primary)">{track.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--text-secondary)">
        {track.durationYears != null && (
          <span>
            <span aria-hidden="true">🕐</span> {track.durationYears}{" "}
            {t("universitiesPage.durationYears")}
          </span>
        )}
        {track.ects != null && (
          <span>
            <span aria-hidden="true">🎓</span> {track.ects}{" "}
            {t("universitiesPage.ects")}
          </span>
        )}
      </div>
      <FacultyBreadcrumb faculty={track.studyProgram.faculty} />
    </ResultCard>
  );
}

export { TrackResult };

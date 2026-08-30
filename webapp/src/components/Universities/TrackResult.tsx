import type { TFunction } from "../../types/i18n";
import type { TrackSearchResult } from "../../schemas/university";

function TrackResult({ track, t }: { track: TrackSearchResult; t: TFunction }) {
  return (
    <li className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <p className="font-bold text-(--text-primary)">{track.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--text-secondary)">
        {track.durationYears != null && (
          <span>
            {track.durationYears} {t("universitiesPage.durationYears")}
          </span>
        )}
        {track.ects != null && (
          <span>
            {track.ects} {t("universitiesPage.ects")}
          </span>
        )}
      </div>
      <p className="text-sm text-(--text-muted) mt-1">
        {track.studyProgram.faculty.name}
        {" - "}
        {track.studyProgram.faculty.university.name}
        {track.studyProgram.faculty.university.acronym &&
          ` (${track.studyProgram.faculty.university.acronym})`}
      </p>
    </li>
  );
}

export { TrackResult };

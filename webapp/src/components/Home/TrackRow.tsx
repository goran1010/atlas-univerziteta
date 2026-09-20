import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types";
import type { UniversityDetailTrack } from "../../schemas/university";

function TrackRow({
  track,
  t,
}: {
  track: UniversityDetailTrack;
  t: TFunction;
}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm py-1 px-0.5 border-b border-(--border-color) last:border-0">
      <span className="font-medium flex-1">{track.name}</span>
      <span className="flex gap-2 flex-wrap text-xs text-(--text-muted) items-center">
        {track.durationYears != null && (
          <span>
            {track.durationYears}{" "}
            {tCount(t, "universitiesPage.durationYears", track.durationYears)}
          </span>
        )}
        {track.ects != null && (
          <span>
            {track.ects} {t("universitiesPage.ects")}
          </span>
        )}
      </span>
    </li>
  );
}

export { TrackRow };

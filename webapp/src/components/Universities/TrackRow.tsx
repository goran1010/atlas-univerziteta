import type { TFunction } from "../../types/i18n";
import type { UniversityDetailTrack } from "../../schemas/university";

function TrackRow({
  track,
  t,
}: {
  track: UniversityDetailTrack;
  t: TFunction;
}) {
  return (
    <li className="flex flex-wrap gap-1 sm:gap-2 text-sm py-1 border-b border-(--border-color) last:border-0">
      <span className="font-medium flex-1">{track.name}</span>
      <span className="flex gap-2 flex-wrap text-xs text-(--text-muted)">
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
      </span>
    </li>
  );
}

export { TrackRow };

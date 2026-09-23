import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types";

interface TrackListItem {
  id: number;
  name: string;
  ects?: number | undefined;
  durationYears?: number | undefined;
}

// Tracks are plain attributes of their study program, so they render as a
// flowing list rather than rows that look like clickable entities.
function TrackList({
  tracks,
  t,
  highlightedTrackId,
}: {
  tracks: TrackListItem[];
  t: TFunction;
  highlightedTrackId?: string | null;
}) {
  if (tracks.length === 0) return null;

  const trackMeta = (track: TrackListItem) => {
    const parts = [];
    if (track.ects != null) {
      parts.push(`${track.ects.toString()} ${t("universitiesPage.ects")}`);
    }
    if (track.durationYears != null) {
      parts.push(
        `${track.durationYears.toString()} ${tCount(
          t,
          "universitiesPage.durationYears",
          track.durationYears,
        )}`,
      );
    }
    return parts.length > 0 ? ` (${parts.join(", ")})` : "";
  };

  return (
    <p className="text-sm text-(--text-secondary) mt-1 leading-relaxed">
      <span className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
        <span className="text-blue-600 dark:text-blue-400">
          {tracks.length}
        </span>{" "}
        {tCount(t, "universitiesPage.trackCount", tracks.length)}:
      </span>{" "}
      {tracks.map((track, index) => (
        <span key={track.id}>
          {index > 0 && <span className="text-(--text-muted)"> · </span>}
          <span
            className={
              String(track.id) === highlightedTrackId
                ? "bg-(--hover-surface) rounded-md px-1 py-0.5 ring-1 ring-(--accent) text-(--text-primary)"
                : "text-(--text-primary)"
            }
          >
            {track.name}
          </span>
          {trackMeta(track) && (
            <span className="text-xs text-(--text-muted)">
              {trackMeta(track)}
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

export { TrackList };

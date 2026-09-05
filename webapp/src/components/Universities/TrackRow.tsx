import { useState } from "react";
import { tCount } from "../../utils/pluralize";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { EntityDetailContent } from "./TrackDetailDialog";

import type { TFunction } from "../../types/i18n";
import type { UniversityDetailTrack } from "../../schemas/university";
import type { EntityAncestors } from "./types";

function TrackRow({
  track,
  t,
  ancestors,
}: {
  track: UniversityDetailTrack;
  t: TFunction;
  ancestors?: EntityAncestors;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm py-1 border-b border-(--border-color) last:border-0">
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
      {ancestors && (
        <>
          <Button
            className="px-2 py-0.5 text-xs w-full sm:w-auto"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {t("universitiesPage.viewInfo")}
          </Button>
          <Dialog
            open={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
            }}
            title={track.name}
          >
            <EntityDetailContent ancestors={ancestors} track={track} />
          </Dialog>
        </>
      )}
    </li>
  );
}

export { TrackRow };

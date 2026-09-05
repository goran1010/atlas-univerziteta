import { useState } from "react";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { tCount } from "../../utils/pluralize";
import { TrackRow } from "./TrackRow";

import type { TFunction } from "../../types/i18n";
import type { UniversityDetailStudyProgram } from "../../schemas/university";

function StudyProgramRow({
  program,
  t,
}: {
  program: UniversityDetailStudyProgram;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);
  const hasTracks = program.tracks.length > 0;

  return (
    <li className="text-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2 py-1 px-0.5 sm:px-2">
        <div className="min-w-0">
          <span className="font-medium">{program.name}</span>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 items-center text-xs text-(--text-muted) mt-0.5">
            {program.durationYears != null && (
              <span>
                <span aria-hidden="true">🕐</span> {program.durationYears}{" "}
                {tCount(t, "universitiesPage.durationYears", program.durationYears)}
              </span>
            )}
            {program.ects != null && (
              <span>
                <span aria-hidden="true">🎓</span> {program.ects}{" "}
                {t("universitiesPage.ects")}
              </span>
            )}
            {program.language && (
              <span>
                <span aria-hidden="true">🗣️</span> {program.language}
              </span>
            )}
            {hasTracks && (
              <span>
                <span aria-hidden="true">📋</span>{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {program.tracks.length}
                </span>{" "}
                {tCount(t, "universitiesPage.trackCount", program.tracks.length)}
              </span>
            )}
          </div>
        </div>
        {hasTracks && (
          <DetailsToggleButton
            expanded={open}
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              setOpen((p) => !p);
            }}
          />
        )}
      </div>
      {open && hasTracks && (
        <div className="ml-0.5 sm:ml-4 mt-1 mb-2 border-l-2 border-(--border-color) pl-1.5 sm:pl-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-1">
            <span className="text-blue-600 dark:text-blue-400">
              {program.tracks.length}
            </span>{" "}
            {tCount(t, "universitiesPage.trackCount", program.tracks.length)}
          </p>
          <ul>
            {program.tracks.map((tr) => (
              <TrackRow key={tr.id} track={tr} t={t} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export { StudyProgramRow };

import { AwardIcon, ClockIcon, SpeechIcon } from "../sharedComponents/icons";
import { tCount } from "../../utils/pluralize";
import { TrackList } from "./TrackList";

import type { TFunction } from "../../types";
import type { UniversityDetailStudyProgram } from "../../schemas/university";

function StudyProgramRow({
  program,
  t,
}: {
  program: UniversityDetailStudyProgram;
  t: TFunction;
}) {
  const hasTracks = program.tracks.length > 0;

  return (
    <li className="text-sm">
      <div className="py-1 px-0.5 sm:px-2 rounded-md">
        <div className="min-w-0">
          <span className="font-medium">{program.name}</span>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 items-center text-xs text-(--text-muted) mt-0.5">
            {program.durationYears != null && (
              <span>
                <ClockIcon /> {program.durationYears}{" "}
                {tCount(
                  t,
                  "universitiesPage.durationYears",
                  program.durationYears,
                )}
              </span>
            )}
            {program.ects != null && (
              <span>
                <AwardIcon /> {program.ects} {t("universitiesPage.ects")}
              </span>
            )}
            {program.language && (
              <span>
                <SpeechIcon /> {program.language}
              </span>
            )}
          </div>
        </div>
      </div>
      {hasTracks && (
        <div className="ml-0.5 sm:ml-4 mb-2">
          <TrackList tracks={program.tracks} t={t} />
        </div>
      )}
    </li>
  );
}

export { StudyProgramRow };

import { use } from "react";
import { AwardIcon, ClockIcon, SpeechIcon } from "../sharedComponents/icons";
import { TextLink } from "../sharedComponents/TextLink";
import { programLanguageNames } from "../../utils/programLanguageNames";
import { TrackList } from "./TrackList";

import { RootContext } from "../../contextData/RootContext";

import type { TFunction } from "../../types";
import type { UniversityDetailStudyProgram } from "../../schemas/university";

function StudyProgramRow({
  program,
  facultyId,
  t,
}: {
  program: UniversityDetailStudyProgram;
  facultyId: number;
  t: TFunction;
}) {
  const { tCount } = use(RootContext);
  const hasTracks = program.tracks.length > 0;

  return (
    <li className="text-sm">
      <div className="py-1 px-0.5 sm:px-2 rounded-md">
        <div className="min-w-0">
          <TextLink
            to={`/faculties/${facultyId.toString()}?program=${program.id.toString()}`}
            variant="title"
            className="font-medium"
          >
            {program.name}
          </TextLink>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 items-center text-xs text-(--text-muted) mt-0.5">
            {program.durationYears != null && (
              <span>
                <ClockIcon /> {program.durationYears}{" "}
                {tCount(
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
            {program.languages.length > 0 && (
              <span>
                <SpeechIcon /> {programLanguageNames(t, program.languages)}
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

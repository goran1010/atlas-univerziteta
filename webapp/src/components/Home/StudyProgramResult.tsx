import { AwardIcon, GraduationCapIcon } from "../sharedComponents/icons";
import { useState, use } from "react";
import { Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { LinkButton } from "../sharedComponents/LinkButton";
import { TrackRow } from "./TrackRow";
import { Spinner } from "../sharedComponents/Spinner";
import { SERVER_URL } from "../../utils/envConfig";
import { readApiError } from "../../schemas/api";
import { notificationMessageKey } from "../../utils/apiError";
import { studyProgramDetailResponseSchema } from "../../schemas/university";
import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types";
import type {
  StudyProgramSearchResult,
  StudyProgramDetail,
} from "../../schemas/university";

function StudyProgramResult({
  program,
  t,
}: {
  program: StudyProgramSearchResult;
  t: TFunction;
}) {
  const { addNotification } = use(RootContext);
  const [expanded, setExpanded] = useState(false);
  const [detailData, setDetailData] = useState<StudyProgramDetail>();
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function handleExpand() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (detailData) {
      setExpanded(true);
      return;
    }
    try {
      setLoadingDetail(true);
      const res = await fetch(
        `${SERVER_URL}/api/v1/study-programs/${program.id.toString()}`,
        { method: "GET", mode: "cors" },
      );
      if (res.ok) {
        const result = studyProgramDetailResponseSchema.parse(await res.json());
        setDetailData(result.data);
        setExpanded(true);
      } else {
        const serverError = readApiError(await res.json());
        if (serverError) {
          console.warn(
            "Failed to load study program details:",
            serverError.message,
          );
        }
        addNotification({
          type: "error",
          message: t(
            notificationMessageKey(
              serverError?.code,
              "messages.universities.detailsError",
            ),
          ),
        });
      }
    } catch (error) {
      console.error("Error loading study program details:", error);
      addNotification({
        type: "error",
        message: t("messages.universities.detailsError"),
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <ResultCard>
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) return;
          void handleExpand();
        }}
        className="cursor-pointer"
      >
        <p className="font-bold">
          <Link
            to={`/faculties/${program.faculty.id.toString()}`}
            className="text-(--text-primary) hover:text-(--accent-text) transition-colors underline-offset-2 hover:underline"
          >
            {program.name}
          </Link>
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-sm text-(--text-secondary)">
          <span>
            <GraduationCapIcon />{" "}
            {t(`universitiesPage.cycles.${program.cycle}`)}
          </span>
          {program.ects != null && (
            <span>
              <AwardIcon /> {program.ects} {t("universitiesPage.ects")}
            </span>
          )}
        </div>
        <FacultyBreadcrumb faculty={program.faculty} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        <LinkButton
          to={`/faculties/${program.faculty.id.toString()}`}
          className="px-3 py-1.5 text-xs border-(--border-color) bg-(--surface-1) shadow-(--card-shadow-soft)"
        >
          {t("universitiesPage.viewInfo")}
        </LinkButton>
        <DetailsToggleButton
          expanded={expanded}
          className="px-3 py-1.5 text-xs"
          onClick={() => {
            void handleExpand();
          }}
          loading={loadingDetail}
        />
      </div>
      {expanded && detailData && (
        <div
          className="mt-3 border-t border-(--border-color) pt-3"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {detailData.tracks.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-2">
                <span className="text-blue-600 dark:text-blue-400">
                  {detailData.tracks.length}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.trackCount",
                  detailData.tracks.length,
                )}
              </p>
              <div className="ml-0.5 sm:ml-4 border-l-2 border-(--border-color) pl-1.5 sm:pl-3">
                <ul>
                  {detailData.tracks.map((tr) => (
                    <TrackRow key={tr.id} track={tr} t={t} />
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-(--text-muted) italic">
              {t("universitiesPage.tracks")}: -
            </p>
          )}
        </div>
      )}
      {loadingDetail && <Spinner />}
    </ResultCard>
  );
}

export { StudyProgramResult };

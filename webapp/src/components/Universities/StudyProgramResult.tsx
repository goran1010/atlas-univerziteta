import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { TrackRow } from "./TrackRow";
import { Spinner } from "../../utils/Spinner";
import { SERVER_URL } from "../../utils/envConfig";
import { guardedFetch } from "../../utils/guardedFetch";
import { readErrorMessage } from "../../schemas/api";
import { isServerNotReadyError } from "../../utils/serverStatus";
import { studyProgramDetailResponseSchema } from "../../schemas/university";
import { tCount } from "../../utils/pluralize";

import type { TFunction } from "../../types/i18n";
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
  const { addNotification, serverStatus } = use(RootContext);
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
      const res = await guardedFetch(
        `${SERVER_URL}/api/v1/study-programs/${program.id.toString()}`,
        { method: "GET", mode: "cors" },
        { serverStatus },
      );
      if (res.ok) {
        const result = studyProgramDetailResponseSchema.parse(await res.json());
        setDetailData(result.data);
        setExpanded(true);
      } else {
        const serverMessage = readErrorMessage(await res.json());
        if (serverMessage) {
          console.warn("Failed to load study program details:", serverMessage);
        }
        addNotification({
          type: "error",
          message: t("messages.universities.detailsError"),
        });
      }
    } catch (error) {
      if (isServerNotReadyError(error)) return;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div className="min-w-0">
          <p className="font-bold text-(--text-primary)">{program.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-sm text-(--text-secondary)">
            <span>
              <span aria-hidden="true">📚</span>{" "}
              {t(`universitiesPage.cycles.${program.cycle}`)}
            </span>
            {program.ects != null && (
              <span>
                <span aria-hidden="true">🎓</span> {program.ects}{" "}
                {t("universitiesPage.ects")}
              </span>
            )}
          </div>
          <FacultyBreadcrumb faculty={program.faculty} />
        </div>
        <DetailsToggleButton
          expanded={expanded}
          className="w-full sm:w-auto px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
          onClick={() => {
            void handleExpand();
          }}
          loading={loadingDetail}
        />
      </div>
      {expanded && detailData && (
        <div className="mt-3 border-t border-(--border-color) pt-3">
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

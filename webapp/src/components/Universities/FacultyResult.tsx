import { LandmarkIcon, MapPinIcon } from "../sharedComponents/icons";
import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ResultCard } from "./ResultCard";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { ContactLinks } from "./ContactLinks";
import { StudyProgramRow } from "./StudyProgramRow";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { Spinner } from "../../utils/Spinner";
import { SERVER_URL } from "../../utils/envConfig";
import { guardedFetch } from "../../utils/guardedFetch";
import { readApiError } from "../../schemas/api";
import { notificationMessageKey } from "../../utils/apiError";
import { SERVER_STATUS, isServerNotReadyError } from "../../utils/serverStatus";
import { facultyDetailResponseSchema } from "../../schemas/university";
import { tCount } from "../../utils/pluralize";

import type {
  FacultySearchResult,
  FacultyDetail,
} from "../../schemas/university";

function FacultyResult({ faculty }: { faculty: FacultySearchResult }) {
  const { t, addNotification, serverStatus } = use(RootContext);
  const [expanded, setExpanded] = useState(false);
  const [detailData, setDetailData] = useState<FacultyDetail>();
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
        `${SERVER_URL}/api/v1/faculties/${faculty.id.toString()}`,
        { method: "GET", mode: "cors" },
        { serverStatus },
      );
      if (res.ok) {
        const result = facultyDetailResponseSchema.parse(await res.json());
        setDetailData(result.data);
        setExpanded(true);
      } else {
        const serverError = readApiError(await res.json());
        if (serverError) {
          console.warn("Failed to load faculty details:", serverError.message);
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
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) return;
          void handleExpand();
        }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 rounded-md transition-colors cursor-pointer hover:bg-(--hover-surface)"
      >
        <div className="min-w-0">
          <p className="font-bold text-(--text-primary)">{faculty.name}</p>
          <p className="text-sm text-(--text-muted) mt-0.5">
            <LandmarkIcon /> {faculty.university.name}
            {faculty.university.acronym && ` (${faculty.university.acronym})`}
          </p>
          {faculty.city && (
            <p className="text-sm text-(--text-secondary) mt-0.5">
              <MapPinIcon /> {faculty.city}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-0.5">
            <ContactLinks website={faculty.website} />
          </div>
        </div>
        <DetailsToggleButton
          expanded={expanded}
          className="w-full sm:w-auto px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
          onClick={() => {
            void handleExpand();
          }}
          disabled={serverStatus !== SERVER_STATUS.LIVE}
          loading={loadingDetail}
        />
      </div>
      {expanded && detailData && (
        <div className="mt-3 border-t border-(--border-color) pt-3">
          {detailData.studyPrograms.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-2">
                <span className="text-blue-600 dark:text-blue-400">
                  {detailData.studyPrograms.length}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.studyProgramCount",
                  detailData.studyPrograms.length,
                )}
              </p>
              <div className="ml-0.5 sm:ml-4 border-l-2 border-(--border-color) pl-1.5 sm:pl-3">
                <div className="flex flex-col gap-2">
                  {groupBy(detailData.studyPrograms, (sp) =>
                    t(`universitiesPage.cycles.${sp.cycle}`),
                  ).map((g) => (
                    <ResultGroup key={g.key} label={g.key}>
                      {g.items.map((sp) => (
                        <StudyProgramRow key={sp.id} program={sp} t={t} />
                      ))}
                    </ResultGroup>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-(--text-muted) italic">
              {t("universitiesPage.studyPrograms")}: -
            </p>
          )}
        </div>
      )}
      {loadingDetail && <Spinner />}
    </ResultCard>
  );
}

export { FacultyResult };

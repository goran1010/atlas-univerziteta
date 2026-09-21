import { LandmarkIcon, MapPinIcon } from "../sharedComponents/icons";
import { useState, use } from "react";
import { Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { ResultCard } from "./ResultCard";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Button } from "../sharedComponents/Button";
import { Dialog } from "../sharedComponents/Dialog";
import { ContactLinks } from "./ContactLinks";
import { ShareButton } from "./ShareButton";
import { StudyProgramRow } from "./StudyProgramRow";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { byCycleDisplayOrder } from "./utils/cycleOrder";
import { Spinner } from "../sharedComponents/Spinner";
import { SERVER_URL } from "../../utils/envConfig";
import { readApiError } from "../../schemas/api";
import { notificationMessageKey } from "../../utils/apiError";
import { facultyDetailResponseSchema } from "../../schemas/university";
import { tCount } from "../../utils/pluralize";

import type {
  FacultySearchResult,
  FacultyDetail,
} from "../../schemas/university";

function FacultyResult({
  faculty,
  contextHint,
}: {
  faculty: FacultySearchResult;
  contextHint?: string;
}) {
  const hasPrograms = (faculty._count?.studyPrograms ?? 0) > 0;
  const { t, addNotification } = use(RootContext);
  const [expanded, setExpanded] = useState(false);
  const [detailData, setDetailData] = useState<FacultyDetail>();
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        `${SERVER_URL}/api/v1/faculties/${faculty.id.toString()}`,
        { method: "GET", mode: "cors" },
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
      console.error("Error loading faculty details:", error);
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
          if (e.target instanceof Element && e.target.closest("a, button"))
            return;
          if (hasPrograms) void handleExpand();
        }}
        className={hasPrograms ? "cursor-pointer" : ""}
      >
        <p className="font-bold">
          <Link
            to={`/faculties/${faculty.id.toString()}`}
            className="font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {faculty.name}
          </Link>
        </p>
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
        {contextHint && (
          <p className="text-xs italic text-(--text-muted) mt-1">
            {contextHint}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          {t("universitiesPage.viewInfo")}
        </Button>
        {hasPrograms && (
          <DetailsToggleButton
            expanded={expanded}
            className="px-3 py-1.5 text-xs"
            onClick={() => {
              void handleExpand();
            }}
            loading={loadingDetail}
          />
        )}
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title={faculty.name}
        headerActions={
          <ShareButton
            url={`/faculties/${faculty.id.toString()}`}
            t={t}
            addNotification={addNotification}
          />
        }
      >
        <div className="flex flex-col gap-3">
          {faculty.city && (
            <p className="text-sm text-(--text-secondary)">
              <MapPinIcon /> {faculty.city}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted)">
            <ContactLinks website={faculty.website} />
          </div>
          <div className="flex justify-center">
            <Link
              to={`/faculties/${faculty.id.toString()}`}
              className="inline-flex items-center justify-center border border-(--border-color) rounded-lg px-4 py-2 text-sm font-medium text-(--text-primary) hover:bg-(--hover-surface) transition-colors"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              {t("universitiesPage.openFullPage")}
            </Link>
          </div>
        </div>
      </Dialog>
      {expanded && detailData && (
        <div
          className="mt-3 border-t border-(--border-color) pt-3"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
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
                  {groupBy(
                    byCycleDisplayOrder(detailData.studyPrograms),
                    (sp) => t(`universitiesPage.cycles.${sp.cycle}`),
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

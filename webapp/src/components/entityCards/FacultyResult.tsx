import { LandmarkIcon, MapPinIcon, TagIcon } from "../sharedComponents/icons";
import { OwnershipPill } from "./UniversityMeta";
import { TextLink } from "../sharedComponents/TextLink";
import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { ResultCard } from "./ResultCard";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Button } from "../sharedComponents/Button";
import { FacultyInfoDialog } from "./FacultyInfoDialog";
import { ContactLinks } from "../entityDetails/ContactLinks";
import { StudyProgramRow } from "./StudyProgramRow";
import { ResultGroup } from "../Search/ResultGroup";
import { LEVEL_GUIDE } from "../../utils/levelColors";
import { groupBy } from "../../utils/groupBy";
import { byCycleDisplayOrder } from "../../utils/cycleOrder";
import { Spinner } from "../sharedComponents/Spinner";
import { fetchPublic } from "../../utils/fetchPublic";
import { facultyDetailResponseSchema } from "../../schemas/university";

import type {
  FacultySearchResult,
  FacultyDetail,
} from "../../schemas/university";

function FacultyResult({
  faculty,
  contextHint,
}: {
  faculty: FacultySearchResult;
  contextHint?: string | undefined;
}) {
  const hasPrograms = (faculty._count?.studyPrograms ?? 0) > 0;
  const { t, tCount } = use(RootContext);
  const { addNotification } = use(NotificationContext);
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
    const result = await fetchPublic(
      {
        path: `/api/v1/faculties/${faculty.id.toString()}`,
        responseSchema: facultyDetailResponseSchema,
        errorMessageKey: "messages.universities.detailsError",
        logLabel: "load faculty details",
      },
      { t, addNotification, setLoading: setLoadingDetail },
    );
    if (result) {
      setDetailData(result.data);
      setExpanded(true);
    }
  }

  return (
    <ResultCard level="FACULTY">
      <div
        onClick={(e) => {
          if (e.target instanceof Element && e.target.closest("a, button"))
            return;
          if (hasPrograms) void handleExpand();
        }}
        className={
          hasPrograms
            ? "cursor-pointer hover:bg-(--hover-surface) rounded-md transition-colors"
            : ""
        }
      >
        <h3 className="font-bold">
          <TextLink
            to={`/faculties/${faculty.id.toString()}`}
            variant="title"
            className="font-bold"
          >
            {faculty.name}
          </TextLink>
        </h3>
        <p className="text-sm text-(--text-muted) mt-0.5">
          <LandmarkIcon /> {faculty.university.name}
          {faculty.university.acronym && ` (${faculty.university.acronym})`}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-(--text-secondary)">
          {faculty.city && (
            <span>
              <MapPinIcon /> {faculty.city}
            </span>
          )}
          <span>
            <TagIcon />{" "}
            {t(`universitiesPage.countries.${faculty.university.country}`)}
          </span>
          {faculty.university.entity && (
            <span>
              <TagIcon />{" "}
              {t(`universitiesPage.entities.${faculty.university.entity}`)}
            </span>
          )}
          <OwnershipPill ownership={faculty.university.ownership} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-0.5">
          <ContactLinks
            website={faculty.website}
            address={faculty.address}
            phone={faculty.phone}
            email={faculty.email}
          />
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
          className="px-3 py-2 sm:py-1.5 text-xs flex-1 sm:flex-initial"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          {t("universitiesPage.viewInfo")}
        </Button>
        {hasPrograms && (
          <DetailsToggleButton
            expanded={expanded}
            className="px-3 py-2 sm:py-1.5 text-xs flex-1 sm:flex-initial"
            onClick={() => {
              void handleExpand();
            }}
            loading={loadingDetail}
          />
        )}
      </div>
      <FacultyInfoDialog
        faculty={faculty}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
      />
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
                <span className="text-violet-600 dark:text-violet-400">
                  {detailData.studyPrograms.length}
                </span>{" "}
                {tCount(
                  "universitiesPage.studyProgramCount",
                  detailData.studyPrograms.length,
                )}
              </p>
              <div
                className={`ml-0.5 sm:ml-4 ${LEVEL_GUIDE.STUDY_PROGRAM} pl-1.5 sm:pl-3`}
              >
                <div className="flex flex-col gap-2">
                  {groupBy(
                    byCycleDisplayOrder(detailData.studyPrograms),
                    (sp) => t(`universitiesPage.cycles.${sp.cycle}`),
                  ).map((g) => (
                    <ResultGroup
                      key={g.key}
                      label={g.key}
                      level="STUDY_PROGRAM"
                    >
                      {g.items.map((sp) => (
                        <StudyProgramRow
                          key={sp.id}
                          program={sp}
                          facultyId={faculty.id}
                          t={t}
                        />
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

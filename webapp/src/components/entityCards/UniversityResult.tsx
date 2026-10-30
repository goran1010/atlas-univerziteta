import { TextLink } from "../sharedComponents/TextLink";
import { UniversityMetaRow } from "./UniversityMeta";
import { BuildingIcon, CalendarIcon } from "../sharedComponents/icons";
import { UniversityInfoDialog } from "./UniversityInfoDialog";
import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../sharedComponents/Spinner";
import { tCount } from "../../utils/pluralize";
import { ContactLinks } from "../entityDetails/ContactLinks";
import { FacultyRow } from "./FacultyRow";
import { ResultGroup } from "../Search/ResultGroup";
import { groupBy } from "../../utils/groupBy";
import { LEVEL_GUIDE, LEVEL_STRIP } from "../../utils/levelColors";
import { fetchPublic } from "../../utils/fetchPublic";
import { universityDetailResponseSchema } from "../../schemas/university";

import type {
  UniversityDetail,
  UniversityListItem,
} from "../../schemas/university";

function UniversityResult({
  university,
  contextHint,
}: {
  university: UniversityListItem;
  contextHint?: string | undefined;
}) {
  const hasFaculties = university._count.faculties > 0;
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [expanded, setExpanded] = useState(false);
  const [detailData, setDetailData] = useState<UniversityDetail>();
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
        path: `/api/v1/universities/${university.id.toString()}`,
        responseSchema: universityDetailResponseSchema,
        errorMessageKey: "messages.universities.detailsError",
        logLabel: "load university details",
      },
      { t, addNotification, setLoading: setLoadingDetail },
    );
    if (result) {
      setDetailData(result.data);
      setExpanded(true);
    }
  }

  const countryLabel = t(`universitiesPage.countries.${university.country}`);
  const entityLabel = university.entity
    ? t(`universitiesPage.entities.${university.entity}`)
    : undefined;

  // The university's own city first, the rest alphabetically. Grouped
  // display only kicks in when there is more than one city.
  function compareCityGroups(a: { key: string }, b: { key: string }) {
    const aIsHomeCity = a.key === university.city;
    const bIsHomeCity = b.key === university.city;
    if (aIsHomeCity !== bIsHomeCity) return aIsHomeCity ? -1 : 1;
    return a.key.localeCompare(b.key);
  }

  const facultyCityGroups = detailData
    ? groupBy(detailData.faculties, (f) => f.city ?? university.city).toSorted(
        compareCityGroups,
      )
    : [];

  return (
    <li
      className={`border border-(--border-color) rounded-lg overflow-hidden bg-(--surface-2) ${LEVEL_STRIP.UNIVERSITY}`}
    >
      <div
        className={`p-2 sm:p-4 transition-colors ${
          hasFaculties ? "cursor-pointer hover:bg-(--hover-surface)" : ""
        }`}
        onClick={(e) => {
          if (e.target instanceof Element && e.target.closest("a, button"))
            return;
          if (hasFaculties) void handleExpand();
        }}
      >
        <div>
          <h3 className="font-bold text-base leading-snug">
            <TextLink
              to={`/universities/${university.id.toString()}`}
              className="font-bold"
            >
              {university.name}
            </TextLink>
            {university.acronym && (
              <span className="ml-2 text-sm font-normal text-(--text-muted)">
                ({university.acronym})
              </span>
            )}
          </h3>
          <UniversityMetaRow
            city={university.city}
            country={university.country}
            entity={university.entity}
            ownership={university.ownership}
            className="gap-x-3 gap-y-0.5 mt-1"
          >
            {university._count.faculties > 0 && (
              <span>
                <BuildingIcon />{" "}
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {university._count.faculties}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.facultyCount",
                  university._count.faculties,
                )}
              </span>
            )}
            {university.foundedYear && (
              <span>
                <CalendarIcon /> {university.foundedYear}
              </span>
            )}
          </UniversityMetaRow>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-1">
            <ContactLinks
              website={university.website}
              address={university.address}
              phone={university.phone}
              email={university.email}
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
          {hasFaculties && (
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
        <UniversityInfoDialog
          university={university}
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
          }}
          countryLabel={countryLabel}
          entityLabel={entityLabel}
        />
      </div>
      {expanded && detailData && (
        <div className="border-t border-(--border-color) p-2 pt-3 sm:p-4 sm:pt-3">
          {detailData.faculties.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-2">
                <span className="text-teal-600 dark:text-teal-400">
                  {detailData.faculties.length}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.facultyCount",
                  detailData.faculties.length,
                )}
              </p>
              <div
                className={`ml-0.5 sm:ml-4 ${LEVEL_GUIDE.FACULTY} pl-1.5 sm:pl-3`}
              >
                {facultyCityGroups.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    {facultyCityGroups.map((g) => (
                      <ResultGroup key={g.key} label={g.key} level="FACULTY">
                        {g.items.map((f) => (
                          <FacultyRow key={f.id} faculty={f} t={t} />
                        ))}
                      </ResultGroup>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {detailData.faculties.map((f) => (
                      <FacultyRow key={f.id} faculty={f} t={t} />
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-(--text-muted) italic">
              {t("universitiesPage.faculties")}: -
            </p>
          )}
        </div>
      )}
      {loadingDetail && <Spinner />}
    </li>
  );
}

export { UniversityResult };

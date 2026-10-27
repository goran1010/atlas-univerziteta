import {
  BuildingIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
} from "../sharedComponents/icons";
import { useState, use } from "react";
import { Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Button } from "../sharedComponents/Button";
import { LinkButton } from "../sharedComponents/LinkButton";
import { Dialog } from "../sharedComponents/Dialog";
import { Spinner } from "../sharedComponents/Spinner";
import { tCount } from "../../utils/pluralize";
import { ContactLinks } from "../entityDetails/ContactLinks";
import { FacultyRow } from "./FacultyRow";
import { ShareButton } from "../entityDetails/ShareButton";
import { ResultGroup } from "../Search/ResultGroup";
import { groupBy } from "../../utils/groupBy";
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
  contextHint?: string;
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

  const entityLabel = t(`universitiesPage.entities.${university.entity}`);

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
    <li className="border border-(--border-color) rounded-lg overflow-hidden bg-(--surface-2)">
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
            <Link
              to={`/universities/${university.id.toString()}`}
              className="font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {university.name}
            </Link>
            {university.acronym && (
              <span className="ml-2 text-sm font-normal text-(--text-muted)">
                ({university.acronym})
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-(--text-secondary)">
            <span>
              <MapPinIcon /> {university.city}
            </span>
            <span>
              <TagIcon /> {entityLabel}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                university.ownership === "PUBLIC"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "bg-(--surface-alt) text-(--text-secondary)"
              }`}
            >
              {university.ownership === "PUBLIC"
                ? t(`universitiesPage.ownership.PUBLIC`)
                : t(`universitiesPage.ownership.PRIVATE`)}
            </span>
            {university._count.faculties > 0 && (
              <span>
                <BuildingIcon />{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
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
          </div>
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
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
          }}
          title={university.name}
          headerActions={
            <ShareButton url={`/universities/${university.id.toString()}`} />
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-secondary)">
              <span>
                <MapPinIcon /> {university.city}
              </span>
              <span>
                <TagIcon /> {entityLabel}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  university.ownership === "PUBLIC"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                    : "bg-(--surface-alt) text-(--text-secondary)"
                }`}
              >
                {t(`universitiesPage.ownership.${university.ownership}`)}
              </span>
              {university.foundedYear && (
                <span>
                  <CalendarIcon /> {university.foundedYear}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted)">
              <ContactLinks
                website={university.website}
                address={university.address}
                phone={university.phone}
                email={university.email}
              />
            </div>
            <p className="text-sm text-(--text-muted)">
              <BuildingIcon />{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {university._count.faculties}
              </span>{" "}
              {tCount(
                t,
                "universitiesPage.facultyCount",
                university._count.faculties,
              )}
            </p>
            <div className="flex justify-center">
              <LinkButton
                to={`/universities/${university.id.toString()}`}
                className="text-sm w-full sm:w-auto"
                onClick={() => {
                  setDialogOpen(false);
                }}
              >
                {t("universitiesPage.openFullPage")}
              </LinkButton>
            </div>
          </div>
        </Dialog>
      </div>
      {expanded && detailData && (
        <div className="border-t border-(--border-color) p-2 pt-3 sm:p-4 sm:pt-3">
          {detailData.faculties.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-2">
                <span className="text-blue-600 dark:text-blue-400">
                  {detailData.faculties.length}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.facultyCount",
                  detailData.faculties.length,
                )}
              </p>
              <div className="ml-0.5 sm:ml-4 border-l-2 border-(--border-color) pl-1.5 sm:pl-3">
                {facultyCityGroups.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    {facultyCityGroups.map((g) => (
                      <ResultGroup key={g.key} label={g.key}>
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

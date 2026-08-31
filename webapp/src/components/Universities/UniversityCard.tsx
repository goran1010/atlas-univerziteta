import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { DetailsToggleButton } from "../sharedComponents/DetailsToggleButton";
import { Spinner } from "../../utils/Spinner";
import { ContactLinks } from "./ContactLinks";
import { FacultyRow } from "./FacultyRow";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { SERVER_URL } from "../../utils/envConfig";
import { readErrorMessage } from "../../schemas/api";
import { guardedFetch } from "../../utils/guardedFetch";
import { isServerNotReadyError } from "../../utils/serverStatus";
import { universityDetailResponseSchema } from "../../schemas/university";

import type {
  UniversityDetail,
  UniversityListItem,
} from "../../schemas/university";

function UniversityCard({ university }: { university: UniversityListItem }) {
  const { t, addNotification, serverStatus } = use(RootContext);
  const [expanded, setExpanded] = useState(false);
  const [detailData, setDetailData] = useState<UniversityDetail>();
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
        `${SERVER_URL}/api/v1/universities/${university.id.toString()}`,
        {
          method: "GET",
          mode: "cors",
        },
        { serverStatus },
      );

      if (res.ok) {
        const result = universityDetailResponseSchema.parse(await res.json());
        setDetailData(result.data);
        setExpanded(true);
      } else {
        const serverMessage = readErrorMessage(await res.json());
        if (serverMessage) {
          console.warn("Failed to load university details:", serverMessage);
        }
        addNotification({
          type: "error",
          message: t("messages.universities.detailsError"),
        });
      }
    } catch (error) {
      if (isServerNotReadyError(error)) {
        return;
      }
      addNotification({
        type: "error",
        message: t("messages.universities.detailsError"),
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  const entityLabel = t(`universitiesPage.entities.${university.entity}`);

  // Faculties grouped by city (faculty city falls back to the university's);
  // the university's own city first, the rest alphabetically. Grouped display
  // only kicks in when there is more than one city.
  const facultyCityGroups = detailData
    ? groupBy(detailData.faculties, (f) => f.city ?? university.city).toSorted(
        (a, b) =>
          Number(b.key === university.city) -
            Number(a.key === university.city) || a.key.localeCompare(b.key),
      )
    : [];

  return (
    <li className="border border-(--border-color) rounded-lg overflow-hidden bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <div className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="min-w-0">
            <h2 className="font-bold text-base text-(--text-primary) leading-snug">
              {university.name}
              {university.acronym && (
                <span className="ml-2 text-sm font-normal text-(--text-muted)">
                  ({university.acronym})
                </span>
              )}
            </h2>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-(--text-secondary)">
              <span>
                <span aria-hidden="true">📍</span> {university.city}
              </span>
              <span>
                <span aria-hidden="true">🏷️</span> {entityLabel}
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
                  <span aria-hidden="true">🏛️</span>{" "}
                  {university._count.faculties}{" "}
                  {t("universitiesPage.facultyCount")}
                </span>
              )}
              {university.foundedYear && (
                <span>
                  <span aria-hidden="true">📅</span> {university.foundedYear}
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
            {detailData.faculties.length > 0 ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) mb-2">
                  {detailData.faculties.length}{" "}
                  {t("universitiesPage.faculties")}
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
      </div>
    </li>
  );
}

export { UniversityCard };

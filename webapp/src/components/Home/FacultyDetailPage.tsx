import { useState, useEffect, use } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../sharedComponents/Spinner";
import {
  AwardIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "../sharedComponents/icons";
import { ContactLinks } from "./ContactLinks";
import { Breadcrumb } from "./Breadcrumb";
import { ShareButton } from "./ShareButton";
import { Button } from "../sharedComponents/Button";
import { ResultGroup } from "./ResultGroup";
import { TrackList } from "./TrackList";
import { groupBy } from "./utils/groupBy";
import { byCycleDisplayOrder } from "./utils/cycleOrder";
import { tCount } from "../../utils/pluralize";
import { SERVER_URL } from "../../utils/envConfig";
import { readApiError } from "../../schemas/api";
import { notificationMessageKey } from "../../utils/apiError";
import { facultyDetailResponseSchema } from "../../schemas/university";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

import type { FacultyDetail } from "../../schemas/university";

function FacultyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, addNotification } = use(RootContext);
  const [faculty, setFaculty] = useState<FacultyDetail>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchFaculty() {
      try {
        setLoading(true);
        setNotFound(false);
        const res = await fetch(`${SERVER_URL}/api/v1/faculties/${id ?? ""}`, {
          method: "GET",
          mode: "cors",
        });
        if (res.ok) {
          const result = facultyDetailResponseSchema.parse(await res.json());
          setFaculty(result.data);
        } else if (res.status === 404) {
          setNotFound(true);
        } else {
          const serverError = readApiError(await res.json());
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
      } catch {
        addNotification({
          type: "error",
          message: t("messages.universities.detailsError"),
        });
      } finally {
        setLoading(false);
      }
    }
    void fetchFaculty();
  }, [id, t, addNotification]);

  if (loading) return <Spinner />;

  if (notFound || !faculty) {
    return (
      <div className="w-full mx-auto px-1 sm:px-4 py-8 text-center">
        <p className="text-(--text-muted) text-lg">
          {t("universitiesPage.noFacultyResults")}
        </p>
        <Link
          to="/search"
          className="text-(--accent-text) underline underline-offset-2 mt-2 inline-block"
        >
          {t("universitiesPage.search")}
        </Link>
      </div>
    );
  }

  // Arriving from a search result focuses the page on that program (and
  // highlights the clicked track); the URL keeps the view shareable.
  const focusedProgram = faculty.studyPrograms.find(
    (sp) => String(sp.id) === searchParams.get("program"),
  );
  const highlightedTrackId = searchParams.get("track");
  const visiblePrograms = focusedProgram
    ? [focusedProgram]
    : faculty.studyPrograms;

  const programsByCycle = groupBy(byCycleDisplayOrder(visiblePrograms), (sp) =>
    t(`universitiesPage.cycles.${sp.cycle}`),
  );

  return (
    <>
      <Helmet>
        <title>{`${faculty.name} | ${t("title.app")}`}</title>
        <meta
          name="description"
          content={`${faculty.name} - ${faculty.university.name}`}
        />
        <link rel="canonical" href={`${SITE_URL}/faculties/${id ?? ""}`} />
      </Helmet>

      <div className="w-full mx-auto px-1 sm:px-4 py-4">
        <Breadcrumb
          items={[
            { label: t("universitiesPage.search"), to: "/search" },
            {
              label: faculty.university.name,
              to: `/universities/${faculty.university.id.toString()}`,
            },
            { label: faculty.name },
          ]}
        />

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-(--text-primary)">
                {faculty.name}
              </h1>
              <ShareButton url={`/faculties/${id ?? ""}`} />
            </div>
            <p className="text-sm text-(--text-secondary) mt-1">
              <Link
                to={`/universities/${faculty.university.id.toString()}`}
                className="font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {faculty.university.name}
                {faculty.university.acronym &&
                  ` (${faculty.university.acronym})`}
              </Link>
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-(--text-secondary)">
              {faculty.city && (
                <span>
                  <MapPinIcon /> {faculty.city}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted) mt-2">
              <ContactLinks
                website={faculty.website}
                address={faculty.address}
                phone={faculty.phone}
                email={faculty.email}
              />
            </div>
          </div>

          <div className="border-t border-(--border-color) pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-(--text-primary)">
                <GraduationCapIcon />{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {visiblePrograms.length}
                </span>{" "}
                {tCount(
                  t,
                  "universitiesPage.studyProgramCount",
                  visiblePrograms.length,
                )}
              </h2>
              {focusedProgram && (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setSearchParams(new URLSearchParams(), { replace: true });
                  }}
                >
                  {t("universitiesPage.showAllPrograms")} (
                  {faculty.studyPrograms.length})
                </Button>
              )}
            </div>
            {faculty.studyPrograms.length > 0 ? (
              <div className="flex flex-col gap-4">
                {programsByCycle.map((group) => (
                  <ResultGroup
                    key={group.key}
                    label={group.key}
                    collapsible
                    count={group.items.length}
                  >
                    {group.items.map((sp) => (
                      <li
                        key={sp.id}
                        className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2)"
                      >
                        <p className="font-semibold text-(--text-primary)">
                          {sp.name}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-(--text-secondary)">
                          {sp.ects != null && (
                            <span>
                              <AwardIcon /> {sp.ects}{" "}
                              {t("universitiesPage.ects")}
                            </span>
                          )}
                          {sp.durationYears != null && (
                            <span>
                              <ClockIcon /> {sp.durationYears}{" "}
                              {tCount(
                                t,
                                "universitiesPage.durationYears",
                                sp.durationYears,
                              )}
                            </span>
                          )}
                          {sp.language && (
                            <span className="text-(--text-muted)">
                              {sp.language}
                            </span>
                          )}
                        </div>
                        <TrackList
                          tracks={sp.tracks}
                          t={t}
                          highlightedTrackId={highlightedTrackId}
                        />
                      </li>
                    ))}
                  </ResultGroup>
                ))}
              </div>
            ) : (
              <p className="text-sm text-(--text-muted) italic">
                {t("universitiesPage.noStudyPrograms")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export { FacultyDetailPage };

import { useState, useEffect, use } from "react";
import { useParams, Link } from "react-router";
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
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
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

  const programsByCoycle = groupBy(faculty.studyPrograms, (sp) =>
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
            <h1 className="text-2xl font-bold text-(--text-primary)">
              {faculty.name}
            </h1>
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
            <h2 className="text-lg font-semibold text-(--text-primary) mb-3">
              <GraduationCapIcon />{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {faculty.studyPrograms.length}
              </span>{" "}
              {tCount(
                t,
                "universitiesPage.studyProgramCount",
                faculty.studyPrograms.length,
              )}
            </h2>
            {faculty.studyPrograms.length > 0 ? (
              <div className="flex flex-col gap-4">
                {programsByCoycle.map((group) => (
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
                        {sp.tracks.length > 0 && (
                          <div className="mt-2 ml-2 sm:ml-4 border-l-2 border-(--border-color) pl-2 sm:pl-3">
                            <p className="text-xs font-semibold text-(--text-muted) mb-1">
                              {sp.tracks.length}{" "}
                              {tCount(
                                t,
                                "universitiesPage.trackCount",
                                sp.tracks.length,
                              )}
                            </p>
                            <ul className="flex flex-col gap-1">
                              {sp.tracks.map((tr) => (
                                <li
                                  key={tr.id}
                                  className="text-sm text-(--text-secondary) flex flex-wrap gap-x-2"
                                >
                                  <span className="text-(--text-primary)">
                                    {tr.name}
                                  </span>
                                  {tr.ects != null && (
                                    <span className="text-xs text-(--text-muted)">
                                      {tr.ects} {t("universitiesPage.ects")}
                                    </span>
                                  )}
                                  {tr.durationYears != null && (
                                    <span className="text-xs text-(--text-muted)">
                                      {tr.durationYears}{" "}
                                      {tCount(
                                        t,
                                        "universitiesPage.durationYears",
                                        tr.durationYears,
                                      )}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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

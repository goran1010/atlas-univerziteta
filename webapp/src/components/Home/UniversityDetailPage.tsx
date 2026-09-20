import { useState, useEffect, use } from "react";
import { useParams, Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../sharedComponents/Spinner";
import {
  BuildingIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
} from "../sharedComponents/icons";
import { ContactLinks } from "./ContactLinks";
import { Breadcrumb } from "./Breadcrumb";
import { tCount } from "../../utils/pluralize";
import { SERVER_URL } from "../../utils/envConfig";
import { readApiError } from "../../schemas/api";
import { notificationMessageKey } from "../../utils/apiError";
import { universityDetailResponseSchema } from "../../schemas/university";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

import type { UniversityDetail } from "../../schemas/university";

function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, addNotification } = use(RootContext);
  const [university, setUniversity] = useState<UniversityDetail>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchUniversity() {
      try {
        setLoading(true);
        setNotFound(false);
        const res = await fetch(
          `${SERVER_URL}/api/v1/universities/${id ?? ""}`,
          { method: "GET", mode: "cors" },
        );
        if (res.ok) {
          const result = universityDetailResponseSchema.parse(await res.json());
          setUniversity(result.data);
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
    void fetchUniversity();
  }, [id, t, addNotification]);

  if (loading) return <Spinner />;

  if (notFound || !university) {
    return (
      <div className="w-full mx-auto px-1 sm:px-4 py-8 text-center">
        <p className="text-(--text-muted) text-lg">
          {t("universitiesPage.noResults")}
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

  const entityLabel = t(`universitiesPage.entities.${university.entity}`);

  return (
    <>
      <Helmet>
        <title>{`${university.name} | ${t("title.app")}`}</title>
        <meta
          name="description"
          content={`${university.name} - ${university.city}, ${entityLabel}`}
        />
        <link rel="canonical" href={`${SITE_URL}/universities/${id ?? ""}`} />
      </Helmet>

      <div className="w-full mx-auto px-1 sm:px-4 py-4">
        <Breadcrumb
          items={[
            { label: t("universitiesPage.search"), to: "/search" },
            { label: university.name },
          ]}
        />

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-(--text-primary)">
              {university.name}
              {university.acronym && (
                <span className="ml-2 text-lg font-normal text-(--text-muted)">
                  ({university.acronym})
                </span>
              )}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-(--text-secondary)">
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted) mt-2">
              <ContactLinks
                website={university.website}
                address={university.address}
                phone={university.phone}
                email={university.email}
              />
            </div>
          </div>

          <div className="border-t border-(--border-color) pt-4">
            <h2 className="text-lg font-semibold text-(--text-primary) mb-3">
              <BuildingIcon />{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {university.faculties.length}
              </span>{" "}
              {tCount(
                t,
                "universitiesPage.facultyCount",
                university.faculties.length,
              )}
            </h2>
            {university.faculties.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {university.faculties.map((faculty) => (
                  <li
                    key={faculty.id}
                    className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors"
                  >
                    <Link
                      to={`/faculties/${faculty.id.toString()}`}
                      className="font-bold underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {faculty.name}
                    </Link>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-(--text-secondary)">
                      {faculty.city && (
                        <span>
                          <MapPinIcon /> {faculty.city}
                        </span>
                      )}
                      {faculty.studyPrograms.length > 0 && (
                        <span className="text-(--text-muted)">
                          {faculty.studyPrograms.length}{" "}
                          {tCount(
                            t,
                            "universitiesPage.studyProgramCount",
                            faculty.studyPrograms.length,
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-1">
                      <ContactLinks website={faculty.website} />
                    </div>
                  </li>
                ))}
              </ul>
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

export { UniversityDetailPage };

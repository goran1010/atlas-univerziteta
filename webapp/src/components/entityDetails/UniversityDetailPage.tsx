import { use } from "react";
import { TextLink } from "../sharedComponents/TextLink";
import { useParams, Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../sharedComponents/Spinner";
import {
  BuildingIcon,
  CalendarIcon,
  MapPinIcon,
} from "../sharedComponents/icons";
import { ContactLinks } from "./ContactLinks";
import { Breadcrumb } from "./Breadcrumb";
import { ShareButton } from "./ShareButton";
import { tCount } from "../../utils/pluralize";
import { universityDetailResponseSchema } from "../../schemas/university";
import { useEntityDetail } from "../../customHooks/useEntityDetail";
import { UniversityMetaRow } from "../entityCards/UniversityMeta";
import { DetailPageStatus } from "./DetailPageStatus";
import { Button } from "../sharedComponents/Button";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = use(RootContext);
  const { state, retry } = useEntityDetail(
    `/api/v1/universities/${id ?? ""}`,
    universityDetailResponseSchema,
    "load university details",
  );

  if (state.kind === "loading") return <Spinner page />;

  if (state.kind === "error") {
    return (
      <DetailPageStatus
        message={t("universitiesPage.detailError")}
        action={
          <Button variant="secondary" className="mt-3" onClick={retry}>
            {t("universitiesPage.retry")}
          </Button>
        }
      />
    );
  }

  if (state.kind === "notFound") {
    return (
      <DetailPageStatus
        message={t("universitiesPage.noResults")}
        action={
          <Link
            to="/search"
            className="text-(--accent-text) underline underline-offset-2 mt-2 inline-block"
          >
            {t("universitiesPage.search")}
          </Link>
        }
      />
    );
  }

  const university = state.data.data;

  const countryLabel = t(`universitiesPage.countries.${university.country}`);
  const entityLabel = university.entity
    ? t(`universitiesPage.entities.${university.entity}`)
    : undefined;

  return (
    <>
      <Helmet>
        <title>{`${university.name} | ${t("title.app")}`}</title>
        <meta
          name="description"
          content={`${university.name} - ${university.city}, ${countryLabel}${entityLabel ? `, ${entityLabel}` : ""}`}
        />
        <link rel="canonical" href={`${SITE_URL}/universities/${id ?? ""}/`} />
        <meta
          property="og:title"
          content={`${university.name} | ${t("title.app")}`}
        />
        <meta
          property="og:description"
          content={`${university.name} - ${university.city}, ${countryLabel}${entityLabel ? `, ${entityLabel}` : ""}`}
        />
        <meta
          property="og:url"
          content={`${SITE_URL}/universities/${id ?? ""}/`}
        />
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
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-(--text-primary)">
                {university.name}
                {university.acronym && (
                  <span className="ml-2 text-lg font-normal text-(--text-muted)">
                    ({university.acronym})
                  </span>
                )}
              </h1>
              <ShareButton url={`/universities/${id ?? ""}`} />
            </div>
            <UniversityMetaRow
              city={university.city}
              country={university.country}
              entity={university.entity}
              ownership={university.ownership}
              className="gap-x-4 gap-y-1 mt-2"
            >
              {university.foundedYear && (
                <span>
                  <CalendarIcon /> {university.foundedYear}
                </span>
              )}
            </UniversityMetaRow>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--text-muted) mt-2">
              <ContactLinks
                website={university.website}
                address={university.address}
                phone={university.phone}
                email={university.email}
                dataSourceUrl={university.dataSourceUrl}
              />
            </div>
          </div>

          <div className="border-t border-(--border-color) pt-4">
            <h2 className="text-lg font-semibold text-(--text-primary) mb-3">
              <BuildingIcon />{" "}
              <span className="text-teal-600 dark:text-teal-400">
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
                    <TextLink
                      to={`/faculties/${faculty.id.toString()}`}
                      className="font-bold"
                    >
                      {faculty.name}
                    </TextLink>
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
                {t("universitiesPage.noFaculties")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export { UniversityDetailPage };

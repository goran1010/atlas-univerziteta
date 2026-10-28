import { use } from "react";
import { TextLink } from "../sharedComponents/TextLink";
import { useParams, useSearchParams, Link } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../sharedComponents/Spinner";
import {
  AwardIcon,
  ClockIcon,
  GraduationCapIcon,
  MapPinIcon,
  BookOpenIcon,
} from "../sharedComponents/icons";
import { ContactLinks } from "./ContactLinks";
import { ExternalLink } from "../sharedComponents/ExternalLink";
import { Breadcrumb } from "./Breadcrumb";
import { ShareButton } from "./ShareButton";
import { Button } from "../sharedComponents/Button";
import { ResultGroup } from "../Search/ResultGroup";
import { TrackList } from "../entityCards/TrackList";
import { groupBy } from "../../utils/groupBy";
import { byCycleDisplayOrder } from "../../utils/cycleOrder";
import { tCount } from "../../utils/pluralize";
import { facultyDetailResponseSchema } from "../../schemas/university";
import { useEntityDetail } from "../../customHooks/useEntityDetail";
import { DetailPageStatus } from "./DetailPageStatus";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../utils/envConfig";

function FacultyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = use(RootContext);
  const { state, retry } = useEntityDetail(
    `/api/v1/faculties/${id ?? ""}`,
    facultyDetailResponseSchema,
    "load faculty details",
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
        message={t("universitiesPage.noFacultyResults")}
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

  const faculty = state.data.data;

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
        <link rel="canonical" href={`${SITE_URL}/faculties/${id ?? ""}/`} />
        <meta
          property="og:title"
          content={`${faculty.name} | ${t("title.app")}`}
        />
        <meta
          property="og:description"
          content={`${faculty.name} - ${faculty.university.name}`}
        />
        <meta
          property="og:url"
          content={`${SITE_URL}/faculties/${id ?? ""}/`}
        />
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
              <TextLink
                to={`/universities/${faculty.university.id.toString()}`}
                className="font-bold"
              >
                {faculty.university.name}
                {faculty.university.acronym &&
                  ` (${faculty.university.acronym})`}
              </TextLink>
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
                dataSourceUrl={faculty.dataSourceUrl}
              />
            </div>
          </div>

          <div className="border-t border-(--border-color) pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-(--text-primary)">
                <GraduationCapIcon />{" "}
                <span className="text-violet-600 dark:text-violet-400">
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
                  className="px-3 py-2 sm:py-1.5 text-xs w-full max-w-xs sm:w-auto"
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
                    level="STUDY_PROGRAM"
                  >
                    {group.items.map((sp) => (
                      <li
                        key={sp.id}
                        className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2)"
                      >
                        <p className="font-semibold text-(--text-primary)">
                          <TextLink
                            to={`/faculties/${id ?? ""}?program=${sp.id.toString()}`}
                          >
                            {sp.name}
                          </TextLink>
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
                          {sp.dataSourceUrl && (
                            <ExternalLink href={sp.dataSourceUrl}>
                              <BookOpenIcon />{" "}
                              {t("universitiesPage.dataSource")}
                            </ExternalLink>
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

import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../../utils/Spinner";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { SERVER_URL } from "../../utils/envConfig";
import { readErrorMessage } from "../../schemas/api";
import { guardedFetch } from "../../utils/guardedFetch";
import { isServerNotReadyError } from "../../utils/serverStatus";
import { universityDetailResponseSchema } from "../../schemas/university";

import type { TFunction } from "../../types/i18n";
import type {
  UniversityDetail,
  UniversityDetailFaculty,
  UniversityDetailStudyProgram,
  UniversityDetailTrack,
  UniversityListItem,
} from "../../schemas/university";

function TrackRow({
  track,
  t,
}: {
  track: UniversityDetailTrack;
  t: TFunction;
}) {
  return (
    <li className="flex flex-wrap gap-1 sm:gap-2 text-sm py-1 border-b border-(--border-color) last:border-0">
      <span className="font-medium flex-1">{track.name}</span>
      <span className="flex gap-2 flex-wrap text-xs text-(--text-muted)">
        {track.durationYears != null && (
          <span>
            {track.durationYears} {t("universitiesPage.durationYears")}
          </span>
        )}
        {track.ects != null && (
          <span>
            {track.ects} {t("universitiesPage.ects")}
          </span>
        )}
      </span>
    </li>
  );
}

function StudyProgramRow({
  program,
  t,
}: {
  program: UniversityDetailStudyProgram;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);
  const hasTracks = program.tracks.length > 0;

  return (
    <li className="text-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2 py-1 px-0.5 sm:px-2">
        <div className="min-w-0">
          <span className="font-medium">{program.name}</span>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 items-center text-xs text-(--text-muted) mt-0.5">
            {program.durationYears != null && (
              <span>
                🕐 {program.durationYears} {t("universitiesPage.durationYears")}
              </span>
            )}
            {program.ects != null && (
              <span>
                🎓 {program.ects} {t("universitiesPage.ects")}
              </span>
            )}
            {program.language && <span>🗣️ {program.language}</span>}
            {hasTracks && (
              <span>
                📋 {program.tracks.length} {t("universitiesPage.tracks")}
              </span>
            )}
          </div>
        </div>
        {hasTracks && (
          <Button
            variant="secondary"
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              setOpen((p) => !p);
            }}
          >
            {open ? "▲" : "▼"}{" "}
            {open
              ? t("universitiesPage.hideDetails")
              : t("universitiesPage.viewDetails")}
          </Button>
        )}
      </div>
      {open && hasTracks && (
        <div className="ml-0.5 sm:ml-4 mt-1 mb-2 border-l-2 border-(--border-color) pl-1.5 sm:pl-3">
          <ul>
            {program.tracks.map((tr) => (
              <TrackRow key={tr.id} track={tr} t={t} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function FacultyRow({
  faculty,
  t,
}: {
  faculty: UniversityDetailFaculty;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="text-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-1.5 px-0.5 sm:px-2">
        <div className="min-w-0">
          <p className="font-semibold">{faculty.name}</p>
          <div className="flex flex-wrap gap-x-1.5 sm:gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-0.5">
            {faculty.studyPrograms.length > 0 && (
              <span>
                🎓 {faculty.studyPrograms.length}{" "}
                {t("universitiesPage.studyPrograms")}
              </span>
            )}
            {faculty.website && (
              <a
                href={faculty.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
              >
                🌐 {faculty.website}
              </a>
            )}
            {faculty.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(faculty.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                🏠 {faculty.address}
              </a>
            )}
            {faculty.phone && (
              <a href={`tel:${faculty.phone}`} className="hover:underline">
                📞 {faculty.phone}
              </a>
            )}
            {faculty.email && (
              <a
                href={`mailto:${faculty.email}`}
                className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
              >
                ✉️ {faculty.email}
              </a>
            )}
          </div>
        </div>
        {faculty.studyPrograms.length > 0 && (
          <Button
            variant="secondary"
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              setOpen((p) => !p);
            }}
          >
            {open ? "▲" : "▼"}{" "}
            {open
              ? t("universitiesPage.hideDetails")
              : t("universitiesPage.viewDetails")}
          </Button>
        )}
      </div>
      {open && faculty.studyPrograms.length > 0 && (
        <div className="ml-0.5 sm:ml-4 mt-1 border-l-2 border-indigo-200 dark:border-indigo-700 pl-1.5 sm:pl-3">
          <div className="flex flex-col gap-2">
            {groupBy(faculty.studyPrograms, (sp) =>
              t(`universitiesPage.cycles.${sp.cycle}`),
            ).map((g) => (
              <ResultGroup key={g.key} label={g.key}>
                {g.items.map((sp) => (
                  <StudyProgramRow key={sp.id} program={sp} t={t} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

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
            <h3 className="font-bold text-base text-(--text-primary) leading-snug">
              {university.name}
              {university.acronym && (
                <span className="ml-2 text-sm font-normal text-(--text-muted)">
                  ({university.acronym})
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-(--text-secondary)">
              <span>📍 {university.city}</span>
              <span>🏷️ {entityLabel}</span>
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
                  🏛️ {university._count.faculties}{" "}
                  {t("universitiesPage.facultyCount")}
                </span>
              )}
              {university.foundedYear && (
                <span>📅 {university.foundedYear}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-muted) mt-1">
              {university.website && (
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
                >
                  🌐 {university.website}
                </a>
              )}
              {university.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(university.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  🏠 {university.address}
                </a>
              )}
              {university.phone && (
                <a href={`tel:${university.phone}`} className="hover:underline">
                  📞 {university.phone}
                </a>
              )}
              {university.email && (
                <a
                  href={`mailto:${university.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
                >
                  ✉️ {university.email}
                </a>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full sm:w-auto px-3 py-1.5 text-xs shrink-0 sm:max-w-36"
            onClick={() => {
              void handleExpand();
            }}
            loading={loadingDetail}
          >
            {expanded ? "▲" : "▼"}{" "}
            {expanded
              ? t("universitiesPage.hideDetails")
              : t("universitiesPage.viewDetails")}
          </Button>
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

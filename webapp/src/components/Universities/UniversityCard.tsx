import { useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../../utils/Spinner";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { SERVER_URL } from "../../utils/envConfig";
import { readErrorMessage } from "../../schemas/api";
import { universityDetailResponseSchema } from "../../schemas/university";

import type { TFunction } from "../../types/i18n";
import type {
  UniversityDetail,
  UniversityDetailFaculty,
  UniversityDetailStudyProgram,
  UniversityDetailSubject,
  UniversityDetailTrack,
  UniversityListItem,
} from "../../schemas/university";

function SubjectRow({
  subject,
  t,
}: {
  subject: UniversityDetailSubject;
  t: TFunction;
}) {
  return (
    <li className="flex flex-wrap gap-2 text-sm py-1 border-b border-(--border-color) last:border-0">
      <span className="font-medium flex-1">{subject.name}</span>
      <span className="flex gap-2 flex-wrap text-xs text-(--text-muted)">
        {subject.semester != null && (
          <span>
            {t("universitiesPage.semester")} {subject.semester}
          </span>
        )}
        {subject.ects != null && (
          <span>
            {subject.ects} {t("universitiesPage.ects")}
          </span>
        )}
        {subject.type && (
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              subject.type === "MANDATORY"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
            }`}
          >
            {t(`universitiesPage.subjectTypes.${subject.type}`)}
          </span>
        )}
      </span>
    </li>
  );
}

function TrackRow({
  track,
  t,
}: {
  track: UniversityDetailTrack;
  t: TFunction;
}) {
  return (
    <li className="flex flex-wrap gap-2 text-sm py-1 border-b border-(--border-color) last:border-0">
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
  return (
    <li className="text-sm">
      <button
        type="button"
        onClick={() => {
          setOpen((p) => !p);
        }}
        className="w-full text-left flex justify-between items-center gap-2 py-1 px-2 rounded hover:bg-(--hover-surface) transition-colors cursor-pointer"
      >
        <span className="font-medium">{program.name}</span>
        <span className="flex gap-2 items-center text-xs text-(--text-muted) shrink-0">
          <span className="hidden sm:inline">
            {t(`universitiesPage.cycles.${program.cycle}`)}
          </span>
          {program.ects != null && (
            <span>
              {program.ects} {t("universitiesPage.ects")}
            </span>
          )}
          <span>
            {open ? "▲" : "▼"}{" "}
            {open
              ? t("universitiesPage.hideDetails")
              : t("universitiesPage.viewDetails")}
          </span>
        </span>
      </button>
      {open && (
        <div className="ml-4 mt-1 mb-2 border-l-2 border-(--border-color) pl-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--text-muted) py-1">
            <span>{t(`universitiesPage.cycles.${program.cycle}`)}</span>
            {program.durationYears != null && (
              <span>
                {program.durationYears} {t("universitiesPage.durationYears")}
              </span>
            )}
            {program.ects != null && (
              <span>
                {program.ects} {t("universitiesPage.ects")}
              </span>
            )}
            {program.language && (
              <span>
                {t("contribution.dataFields.language")}: {program.language}
              </span>
            )}
          </div>
          {program.tracks.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted) pt-1">
                {t("universitiesPage.tracks")}
              </p>
              <ul>
                {program.tracks.map((tr) => (
                  <TrackRow key={tr.id} track={tr} t={t} />
                ))}
              </ul>
            </>
          )}
          {program.subjects.length > 0 ? (
            <div className="flex flex-col gap-2">
              {groupBy(program.subjects, (s) =>
                s.type
                  ? t(`universitiesPage.subjectTypes.${s.type}`)
                  : t("universitiesPage.subjectsSection"),
              ).map((g) => (
                <ResultGroup key={g.key} label={g.key}>
                  {g.items.map((s) => (
                    <SubjectRow key={s.id} subject={s} t={t} />
                  ))}
                </ResultGroup>
              ))}
            </div>
          ) : (
            <p className="text-xs text-(--text-muted) italic py-1">
              {t("universitiesPage.noSubjects")}
            </p>
          )}
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
      <button
        type="button"
        onClick={() => {
          setOpen((p) => !p);
        }}
        className="w-full text-left flex justify-between items-center gap-2 py-1.5 px-2 rounded hover:bg-(--hover-surface) transition-colors font-semibold cursor-pointer"
      >
        <span>{faculty.name}</span>
        <span className="flex gap-2 items-center text-xs text-(--text-muted) shrink-0">
          {faculty.studyPrograms.length > 0 && (
            <span>
              {faculty.studyPrograms.length}{" "}
              {t("universitiesPage.studyPrograms")}
            </span>
          )}
          <span>
            {open ? "▲" : "▼"}{" "}
            {open
              ? t("universitiesPage.hideDetails")
              : t("universitiesPage.viewDetails")}
          </span>
        </span>
      </button>
      {open && (
        <div className="ml-4 mt-1 border-l-2 border-indigo-200 dark:border-indigo-700 pl-3">
          {(faculty.city ?? faculty.website) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--text-muted) py-1">
              {faculty.city && <span>📍 {faculty.city}</span>}
              {faculty.website && (
                <a
                  href={faculty.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
                >
                  {faculty.website}
                </a>
              )}
            </div>
          )}
          {faculty.studyPrograms.length > 0 ? (
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
          ) : (
            <p className="text-xs text-(--text-muted) italic py-1">
              {t("universitiesPage.noStudyPrograms")}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function UniversityCard({ university }: { university: UniversityListItem }) {
  const { t, addNotification } = use(RootContext);
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
      const res = await fetch(
        `${SERVER_URL}/api/v1/universities/${university.id.toString()}`,
        {
          method: "GET",
          mode: "cors",
        },
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
    } catch {
      addNotification({
        type: "error",
        message: t("messages.universities.detailsError"),
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  const entityLabel = t(`universitiesPage.entities.${university.entity}`);

  return (
    <li className="border border-(--border-color) rounded-lg overflow-hidden bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <div className="p-3 sm:p-4">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-(--text-primary) leading-snug">
              {university.name}
              {university.acronym && (
                <span className="ml-2 text-sm font-normal text-(--text-muted)">
                  ({university.acronym})
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--text-secondary)">
              <span>📍 {university.city}</span>
              <span>{entityLabel}</span>
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
                <span>
                  {t("universitiesPage.foundedYear")}: {university.foundedYear}
                </span>
              )}
            </div>
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block truncate max-w-xs"
              >
                {university.website}
              </a>
            )}
          </div>
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs shrink-0 max-w-36"
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
                <ul className="space-y-1">
                  {detailData.faculties.map((f) => (
                    <FacultyRow key={f.id} faculty={f} t={t} />
                  ))}
                </ul>
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

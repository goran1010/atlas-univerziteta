import { useState, use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ChevronDownIcon, SearchIcon } from "../sharedComponents/icons";
import { UniversityCard } from "./UniversityCard";
import { FacultyResult } from "./FacultyResult";
import { StudyProgramResult } from "./StudyProgramResult";
import { TrackResult } from "./TrackResult";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";

import type { UnifiedSearchResults } from "../../schemas/university";

function ResultSection({
  heading,
  count,
  emptyMessage,
  isEmpty,
  children,
}: {
  heading: string;
  count: number;
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = use(RootContext);

  return (
    <section className="w-full flex flex-col gap-2 border border-(--border-color) rounded-lg p-3">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {heading}
          {!isEmpty && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold align-middle bg-(--hover-surface) text-(--accent-text)">
              {count}
            </span>
          )}
        </h2>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => {
              setCollapsed((prev) => !prev);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--hover-surface) rounded-md cursor-pointer transition-colors"
          >
            <ChevronDownIcon
              className={`text-[10px] transition-transform ${collapsed ? "-rotate-90" : ""}`}
            />
            {collapsed
              ? t("universitiesPage.expand")
              : t("universitiesPage.collapse")}
          </button>
        )}
      </div>
      {isEmpty ? (
        <p className="text-(--text-muted)">{emptyMessage}</p>
      ) : (
        !collapsed && children
      )}
    </section>
  );
}

function SearchResults({
  results,
  t,
}: {
  results: UnifiedSearchResults;
  t: (key: string) => string;
}) {
  const noResultsAtAll =
    results.universities.length === 0 &&
    results.faculties.length === 0 &&
    results.studyPrograms.length === 0 &&
    results.tracks.length === 0;

  if (noResultsAtAll) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-(--text-muted)">
        <SearchIcon size={36} />
        <p>{t("universitiesPage.noResultsAtAll")}</p>
      </div>
    );
  }

  return (
    <>
      <ResultSection
        heading={t("universitiesPage.universitiesSection")}
        count={results.universities.length}
        emptyMessage={t("universitiesPage.noResults")}
        isEmpty={results.universities.length === 0}
      >
        <div className="flex flex-col gap-3 w-full">
          {groupBy(results.universities, (u) =>
            t(`universitiesPage.ownership.${u.ownership}`),
          ).map((g) => (
            <ResultGroup key={g.key} label={g.key}>
              {g.items.map((u) => (
                <UniversityCard key={u.id} university={u} />
              ))}
            </ResultGroup>
          ))}
        </div>
      </ResultSection>
      <ResultSection
        heading={t("universitiesPage.facultiesSection")}
        count={results.faculties.length}
        emptyMessage={t("universitiesPage.noFacultyResults")}
        isEmpty={results.faculties.length === 0}
      >
        <div className="flex flex-col gap-3 w-full">
          {groupBy(results.faculties, (f) => f.university.name).map((g) => (
            <ResultGroup key={g.key} label={g.key}>
              {g.items.map((f) => (
                <FacultyResult key={f.id} faculty={f} />
              ))}
            </ResultGroup>
          ))}
        </div>
      </ResultSection>
      <ResultSection
        heading={t("universitiesPage.studyProgramsSection")}
        count={results.studyPrograms.length}
        emptyMessage={t("universitiesPage.noStudyProgramResults")}
        isEmpty={results.studyPrograms.length === 0}
      >
        <div className="flex flex-col gap-3 w-full">
          {groupBy(results.studyPrograms, (p) =>
            t(`universitiesPage.cycles.${p.cycle}`),
          ).map((g) => (
            <ResultGroup key={g.key} label={g.key}>
              {g.items.map((p) => (
                <StudyProgramResult key={p.id} program={p} t={t} />
              ))}
            </ResultGroup>
          ))}
        </div>
      </ResultSection>
      <ResultSection
        heading={t("universitiesPage.tracksSection")}
        count={results.tracks.length}
        emptyMessage={t("universitiesPage.noTrackResults")}
        isEmpty={results.tracks.length === 0}
      >
        <div className="flex flex-col gap-3 w-full">
          {groupBy(results.tracks, (tr) => tr.studyProgram.name).map((g) => (
            <ResultGroup key={g.key} label={g.key}>
              {g.items.map((tr) => (
                <TrackResult key={tr.id} track={tr} t={t} />
              ))}
            </ResultGroup>
          ))}
        </div>
      </ResultSection>
    </>
  );
}

export { SearchResults };

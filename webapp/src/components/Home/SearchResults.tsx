import { useState, type ReactNode } from "react";
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

  return (
    <section className="w-full flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          if (!isEmpty) setCollapsed((prev) => !prev);
        }}
        className={`flex items-center gap-2 text-left w-full ${isEmpty ? "" : "cursor-pointer"}`}
      >
        {!isEmpty && (
          <ChevronDownIcon
            className={`text-xs text-(--text-muted) transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        )}
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {heading}
          {!isEmpty && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold align-middle bg-(--hover-surface) text-(--accent-text)">
              {count}
            </span>
          )}
        </h2>
      </button>
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

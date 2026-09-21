import { use, useState, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { SearchIcon } from "../sharedComponents/icons";
import { Button } from "../sharedComponents/Button";
import { UniversityCard } from "./UniversityCard";
import { FacultyResult } from "./FacultyResult";
import { StudyProgramResult } from "./StudyProgramResult";
import { TrackResult } from "./TrackResult";
import { ResultGroup } from "./ResultGroup";
import { CollapseToggle } from "./CollapseToggle";
import { groupBy } from "./utils/groupBy";

import type { UnifiedSearchResults } from "../../schemas/university";
import type { SearchType } from "../../schemas/domain";

// above this many items in a section, its groups start out collapsed so a
// full single-type listing stays scannable
const COLLAPSE_GROUPS_ABOVE = 50;

function ResultSection({
  heading,
  total,
  shown,
  onShowAll,
  children,
}: {
  heading: string;
  total: number;
  shown: number;
  onShowAll?: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = use(RootContext);

  return (
    <section className="w-full flex flex-col gap-2 border border-(--border-color) rounded-lg p-3">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {heading}
          <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold align-middle bg-(--hover-surface) text-(--accent-text)">
            {shown < total
              ? `${shown.toString()} / ${total.toString()}`
              : total}
          </span>
        </h2>
        <CollapseToggle
          collapsed={collapsed}
          onClick={() => {
            setCollapsed((prev) => !prev);
          }}
          t={t}
        />
      </div>
      {!collapsed && (
        <>
          {children}
          {shown < total && (
            <div className="flex flex-col items-center gap-1.5 mt-1">
              <p className="text-xs text-(--text-muted)">
                {t("universitiesPage.showingFirst")} {shown}{" "}
                {t("universitiesPage.showingOf")} {total}
              </p>
              {onShowAll && (
                <Button
                  variant="secondary"
                  className="px-4 py-1.5 text-xs"
                  onClick={onShowAll}
                >
                  {t("universitiesPage.showAll")} ({total})
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SearchResults({
  results,
  t,
  onShowAll,
}: {
  results: UnifiedSearchResults;
  t: (key: string) => string;
  onShowAll?: (type: SearchType) => void;
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

  const universitiesTotal =
    results.totals?.universities ?? results.universities.length;
  const facultiesTotal = results.totals?.faculties ?? results.faculties.length;
  const studyProgramsTotal =
    results.totals?.studyPrograms ?? results.studyPrograms.length;
  const tracksTotal = results.totals?.tracks ?? results.tracks.length;

  const groupsCollapsed = (shown: number) => shown > COLLAPSE_GROUPS_ABOVE;

  return (
    <>
      {results.universities.length > 0 && (
        <ResultSection
          heading={t("universitiesPage.universitiesSection")}
          total={universitiesTotal}
          shown={results.universities.length}
          onShowAll={
            onShowAll &&
            (() => {
              onShowAll("university");
            })
          }
        >
          <div className="flex flex-col gap-3 w-full">
            {groupBy(results.universities, (u) =>
              t(`universitiesPage.ownership.${u.ownership}`),
            ).map((g) => (
              <ResultGroup
                key={g.key}
                label={g.key}
                collapsible
                count={g.items.length}
                defaultCollapsed={groupsCollapsed(results.universities.length)}
              >
                {g.items.map((u) => (
                  <UniversityCard key={u.id} university={u} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </ResultSection>
      )}
      {results.faculties.length > 0 && (
        <ResultSection
          heading={t("universitiesPage.facultiesSection")}
          total={facultiesTotal}
          shown={results.faculties.length}
          onShowAll={
            onShowAll &&
            (() => {
              onShowAll("faculty");
            })
          }
        >
          <div className="flex flex-col gap-3 w-full">
            {groupBy(results.faculties, (f) => f.university.name).map((g) => (
              <ResultGroup
                key={g.key}
                label={g.key}
                collapsible
                count={g.items.length}
                defaultCollapsed={groupsCollapsed(results.faculties.length)}
              >
                {g.items.map((f) => (
                  <FacultyResult key={f.id} faculty={f} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </ResultSection>
      )}
      {results.studyPrograms.length > 0 && (
        <ResultSection
          heading={t("universitiesPage.studyProgramsSection")}
          total={studyProgramsTotal}
          shown={results.studyPrograms.length}
          onShowAll={
            onShowAll &&
            (() => {
              onShowAll("studyProgram");
            })
          }
        >
          <div className="flex flex-col gap-3 w-full">
            {groupBy(results.studyPrograms, (p) =>
              t(`universitiesPage.cycles.${p.cycle}`),
            ).map((g) => (
              <ResultGroup
                key={g.key}
                label={g.key}
                collapsible
                count={g.items.length}
                defaultCollapsed={groupsCollapsed(results.studyPrograms.length)}
              >
                {g.items.map((p) => (
                  <StudyProgramResult key={p.id} program={p} t={t} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </ResultSection>
      )}
      {results.tracks.length > 0 && (
        <ResultSection
          heading={t("universitiesPage.tracksSection")}
          total={tracksTotal}
          shown={results.tracks.length}
          onShowAll={
            onShowAll &&
            (() => {
              onShowAll("track");
            })
          }
        >
          <div className="flex flex-col gap-3 w-full">
            {groupBy(results.tracks, (tr) => tr.studyProgram.name).map((g) => (
              <ResultGroup
                key={g.key}
                label={g.key}
                collapsible
                count={g.items.length}
                defaultCollapsed={groupsCollapsed(results.tracks.length)}
              >
                {g.items.map((tr) => (
                  <TrackResult key={tr.id} track={tr} t={t} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </ResultSection>
      )}
    </>
  );
}

export { SearchResults };

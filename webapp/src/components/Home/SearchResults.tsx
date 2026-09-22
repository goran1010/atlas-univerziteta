import { use, useState, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { SearchIcon } from "../sharedComponents/icons";
import { Button } from "../sharedComponents/Button";
import { UniversityCard } from "./UniversityCard";
import { FacultyResult } from "./FacultyResult";
import { StudyProgramResult } from "./StudyProgramResult";
import { ResultGroup } from "./ResultGroup";
import { CollapseToggle } from "./CollapseToggle";
import { groupBy } from "./utils/groupBy";
import { cycleRank } from "./utils/cycleOrder";

import type { UnifiedSearchResults } from "../../schemas/university";
import type { SearchType } from "../../schemas/domain";

// above this many items in a section, its groups start out collapsed so a
// full single-type listing stays scannable
const COLLAPSE_GROUPS_ABOVE = 50;

// browsing keeps the hierarchy order; a term search ranks sections with
// direct (own-field) matches first, most specific first
const BROWSE_ORDER: SearchType[] = ["university", "faculty", "studyProgram"];
const SEARCH_ORDER: SearchType[] = ["studyProgram", "faculty", "university"];

function ResultSection({
  heading,
  total,
  shown,
  defaultCollapsed = false,
  onShowAll,
  children,
}: {
  heading: string;
  total: number;
  shown: number;
  defaultCollapsed?: boolean;
  onShowAll?: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
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
  hadTerm = false,
  t,
  onShowAll,
}: {
  results: UnifiedSearchResults;
  hadTerm?: boolean;
  t: (key: string) => string;
  onShowAll?: (type: SearchType) => void;
}) {
  const noResultsAtAll =
    results.universities.length === 0 &&
    results.faculties.length === 0 &&
    results.studyPrograms.length === 0;

  if (noResultsAtAll) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-(--text-muted)">
        <SearchIcon size={36} />
        <p>{t("universitiesPage.noResultsAtAll")}</p>
      </div>
    );
  }

  // items arrive own-field matches first; everything past `direct` only
  // matched through related data and gets an explanatory hint
  const contextHintFor = (type: SearchType, index: number, direct: number) =>
    hadTerm && index >= direct
      ? t(`universitiesPage.contextMatch.${type}`)
      : undefined;

  const sectionData = {
    university: {
      shown: results.universities.length,
      total: results.totals?.universities ?? results.universities.length,
      direct: results.direct?.universities ?? results.universities.length,
    },
    faculty: {
      shown: results.faculties.length,
      total: results.totals?.faculties ?? results.faculties.length,
      direct: results.direct?.faculties ?? results.faculties.length,
    },
    studyProgram: {
      shown: results.studyPrograms.length,
      total: results.totals?.studyPrograms ?? results.studyPrograms.length,
      direct: results.direct?.studyPrograms ?? results.studyPrograms.length,
    },
  } satisfies Record<
    SearchType,
    { shown: number; total: number; direct: number }
  >;

  const groupsCollapsed = (shown: number) => shown > COLLAPSE_GROUPS_ABOVE;

  function renderSectionBody(type: SearchType): ReactNode {
    const { shown, direct } = sectionData[type];
    switch (type) {
      case "university":
        return groupBy(
          results.universities.map((item, index) => ({
            item,
            hint: contextHintFor(type, index, direct),
          })),
          (entry) => t(`universitiesPage.ownership.${entry.item.ownership}`),
        ).map((g) => (
          <ResultGroup
            key={g.key}
            label={g.key}
            collapsible
            count={g.items.length}
            defaultCollapsed={groupsCollapsed(shown)}
          >
            {g.items.map(({ item, hint }) => (
              <UniversityCard
                key={item.id}
                university={item}
                contextHint={hint}
              />
            ))}
          </ResultGroup>
        ));
      case "faculty":
        return groupBy(
          results.faculties.map((item, index) => ({
            item,
            hint: contextHintFor(type, index, direct),
          })),
          (entry) => entry.item.university.name,
        ).map((g) => (
          <ResultGroup
            key={g.key}
            label={g.key}
            collapsible
            count={g.items.length}
            defaultCollapsed={groupsCollapsed(shown)}
          >
            {g.items.map(({ item, hint }) => (
              <FacultyResult key={item.id} faculty={item} contextHint={hint} />
            ))}
          </ResultGroup>
        ));
      case "studyProgram":
        return groupBy(
          results.studyPrograms
            .map((item, index) => ({
              item,
              hint: contextHintFor(type, index, direct),
            }))
            .toSorted(
              (a, b) => cycleRank(a.item.cycle) - cycleRank(b.item.cycle),
            ),
          (entry) => t(`universitiesPage.cycles.${entry.item.cycle}`),
        ).map((g) => (
          <ResultGroup
            key={g.key}
            label={g.key}
            collapsible
            count={g.items.length}
            defaultCollapsed={groupsCollapsed(shown)}
          >
            {g.items.map(({ item, hint }) => (
              <StudyProgramResult
                key={item.id}
                program={item}
                t={t}
                contextHint={hint}
              />
            ))}
          </ResultGroup>
        ));
    }
  }

  const HEADING_KEYS: Record<SearchType, string> = {
    university: "universitiesPage.universitiesSection",
    faculty: "universitiesPage.facultiesSection",
    studyProgram: "universitiesPage.studyProgramsSection",
  };

  const baseOrder = hadTerm ? SEARCH_ORDER : BROWSE_ORDER;
  const visibleTypes = baseOrder.filter((type) => sectionData[type].shown > 0);
  const orderedTypes = hadTerm
    ? [
        ...visibleTypes.filter((type) => sectionData[type].direct > 0),
        ...visibleTypes.filter((type) => sectionData[type].direct === 0),
      ]
    : visibleTypes;

  // when the words of a query spread across the hierarchy (e.g. a program
  // name plus a city), no section has all-words own-field matches - still
  // keep the top section open instead of presenting a fully collapsed page
  const allContextOnly =
    hadTerm && orderedTypes.every((type) => sectionData[type].direct === 0);

  return (
    <>
      {orderedTypes.map((type, index) => {
        const { shown, total, direct } = sectionData[type];
        const contextOnly = hadTerm && direct === 0;
        const startCollapsed = contextOnly && !(allContextOnly && index === 0);
        return (
          <ResultSection
            // remount when the band changes so defaultCollapsed reapplies
            key={`${type}:${startCollapsed.toString()}`}
            heading={t(HEADING_KEYS[type])}
            total={total}
            shown={shown}
            defaultCollapsed={startCollapsed}
            onShowAll={
              onShowAll &&
              (() => {
                onShowAll(type);
              })
            }
          >
            <div className="flex flex-col gap-3 w-full">
              {renderSectionBody(type)}
            </div>
          </ResultSection>
        );
      })}
    </>
  );
}

export { SearchResults };

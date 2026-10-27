import { use, useState, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { SearchIcon } from "../sharedComponents/icons";
import { UniversityResult } from "../entityCards/UniversityResult";
import { FacultyResult } from "../entityCards/FacultyResult";
import { StudyProgramResult } from "../entityCards/StudyProgramResult";
import { ResultGroup } from "./ResultGroup";
import { CollapseToggle } from "./CollapseToggle";
import { groupBy } from "../../utils/groupBy";
import { cycleRank } from "../../utils/cycleOrder";

import { LEVEL_BADGE } from "../../utils/levelColors";

import type { UnifiedSearchResults } from "../../schemas/university";
import type { SearchType } from "../../schemas/domain";
import type { EntityLevel } from "../../utils/levelColors";

const SECTION_LEVEL: Record<SearchType, EntityLevel> = {
  university: "UNIVERSITY",
  faculty: "FACULTY",
  studyProgram: "STUDY_PROGRAM",
};

// above this many items in a section, its groups start out collapsed so a
// full single-type listing stays scannable; high enough that ordinary
// searches start expanded and only huge listings (a bare browse) fold
const COLLAPSE_GROUPS_ABOVE = 150;

// browsing keeps the hierarchy order; a term search ranks sections with
// direct (own-field) matches first, most specific first
const BROWSE_ORDER: SearchType[] = ["university", "faculty", "studyProgram"];
const SEARCH_ORDER: SearchType[] = ["studyProgram", "faculty", "university"];

function ResultSection({
  heading,
  count,
  level,
  defaultCollapsed = false,
  children,
}: {
  heading: string;
  count: number;
  level: EntityLevel;
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { t } = use(RootContext);

  return (
    <section className="w-full flex flex-col gap-2 border border-(--border-color) rounded-lg p-3">
      <div className="flex items-center justify-between gap-3 w-full">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {heading}
          <span
            className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold align-middle ${LEVEL_BADGE[level]}`}
          >
            {count}
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
      {!collapsed && children}
    </section>
  );
}

function SearchResults({
  results,
  hadTerm = false,
  t,
}: {
  results: UnifiedSearchResults;
  hadTerm?: boolean;
  t: (key: string) => string;
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
      count: results.universities.length,
      direct: results.direct?.universities ?? results.universities.length,
    },
    faculty: {
      count: results.faculties.length,
      direct: results.direct?.faculties ?? results.faculties.length,
    },
    studyProgram: {
      count: results.studyPrograms.length,
      direct: results.direct?.studyPrograms ?? results.studyPrograms.length,
    },
  } satisfies Record<SearchType, { count: number; direct: number }>;

  const groupsCollapsed = (count: number) => count > COLLAPSE_GROUPS_ABOVE;

  function renderSectionBody(type: SearchType): ReactNode {
    const { count, direct } = sectionData[type];
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
            level={SECTION_LEVEL[type]}
            defaultCollapsed={groupsCollapsed(count)}
          >
            {g.items.map(({ item, hint }) => (
              <UniversityResult
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
            level={SECTION_LEVEL[type]}
            defaultCollapsed={groupsCollapsed(count)}
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
            level={SECTION_LEVEL[type]}
            defaultCollapsed={groupsCollapsed(count)}
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
  const visibleTypes = baseOrder.filter((type) => sectionData[type].count > 0);
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
        const { count, direct } = sectionData[type];
        const contextOnly = hadTerm && direct === 0;
        const startCollapsed = contextOnly && !(allContextOnly && index === 0);
        return (
          <ResultSection
            // remount when the band changes so defaultCollapsed reapplies
            key={`${type}:${startCollapsed.toString()}`}
            heading={t(HEADING_KEYS[type])}
            count={count}
            level={SECTION_LEVEL[type]}
            defaultCollapsed={startCollapsed}
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

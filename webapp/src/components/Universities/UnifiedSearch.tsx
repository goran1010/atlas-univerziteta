import {
  useState,
  use,
  useEffect,
  useRef,
  type ReactNode,
  type SubmitEvent,
} from "react";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../../utils/Spinner";
import { UniversityCard } from "./UniversityCard";
import { FacultyResult } from "./FacultyResult";
import { StudyProgramResult } from "./StudyProgramResult";
import { TrackResult } from "./TrackResult";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { searchAll } from "./utils/search";
import { isServerNotReadyError } from "../../utils/serverStatus";
import { searchTermSchema } from "../../schemas/domain";

import type { UnifiedSearchResults } from "../../schemas/university";
import type { Entity, Ownership, StudyCycle } from "../../schemas/domain";

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
          <span
            className="text-xs text-(--text-muted) transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          >
            ▼
          </span>
        )}
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {heading}
          {!isEmpty && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold align-middle bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
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

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const ENTITIES: Entity[] = ["FBIH", "RS", "BD"];
const OWNERSHIPS: Ownership[] = ["PUBLIC", "PRIVATE"];
const CYCLES: StudyCycle[] = [
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
];

function UnifiedSearch() {
  const { t, addNotification, serverStatus } = use(RootContext);
  const [results, setResults] = useState<UnifiedSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [entityFilter, setEntityFilter] = useState<Entity | "">("");
  const [ownershipFilter, setOwnershipFilter] = useState<Ownership | "">("");
  const [cycleFilter, setCycleFilter] = useState<StudyCycle | "">("");
  const hasFilters =
    entityFilter !== "" || ownershipFilter !== "" || cycleFilter !== "";

  // Auto-focus the search input only on devices with a precise pointer
  // (mouse/trackpad) so mobile users don't get the keyboard popping up.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  function handleClear() {
    setSearchInput("");
    inputRef.current?.focus();
  }

  async function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    const searchTerm = searchTermSchema.safeParse(searchInput);
    if (!searchTerm.success) {
      addNotification({
        type: "error",
        message: t(
          searchTerm.error.issues[0]?.message ?? "validation.search.minLength",
        ),
      });
      return;
    }
    const term = searchTerm.data;
    try {
      setLoading(true);
      setResults(
        await searchAll(term, serverStatus, {
          entity: entityFilter || undefined,
          ownership: ownershipFilter || undefined,
          cycle: cycleFilter || undefined,
        }),
      );
    } catch (error) {
      if (isServerNotReadyError(error)) {
        return;
      }
      addNotification({
        type: "error",
        message: t("messages.universities.searchError"),
      });
    } finally {
      setLoading(false);
    }
  }

  const noResultsAtAll =
    results !== null &&
    results.universities.length === 0 &&
    results.faculties.length === 0 &&
    results.studyPrograms.length === 0 &&
    results.tracks.length === 0;

  return (
    <div className="flex flex-col gap-4 w-full items-center justify-center">
      <p className="text-sm text-center text-(--text-secondary) max-w-lg">
        {t("universitiesPage.searchHint")}
      </p>
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 w-full max-w-lg">
        <label className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-xs font-semibold text-(--text-muted)">
            {t("universitiesPage.filterEntity")}
          </span>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value as Entity | "");
            }}
            className="text-xs px-2 py-1.5 rounded-md bg-(--surface-2) border border-(--border-color) text-(--text-primary) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <option value="">{t("universitiesPage.all")}</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>
                {t(`universitiesPage.entities.${e}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-xs font-semibold text-(--text-muted)">
            {t("universitiesPage.filterOwnership")}
          </span>
          <select
            value={ownershipFilter}
            onChange={(e) => {
              setOwnershipFilter(e.target.value as Ownership | "");
            }}
            className="text-xs px-2 py-1.5 rounded-md bg-(--surface-2) border border-(--border-color) text-(--text-primary) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <option value="">{t("universitiesPage.all")}</option>
            {OWNERSHIPS.map((o) => (
              <option key={o} value={o}>
                {t(`universitiesPage.ownership.${o}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-xs font-semibold text-(--text-muted)">
            {t("universitiesPage.filterCycle")}
          </span>
          <select
            value={cycleFilter}
            onChange={(e) => {
              setCycleFilter(e.target.value as StudyCycle | "");
            }}
            className="text-xs px-2 py-1.5 rounded-md bg-(--surface-2) border border-(--border-color) text-(--text-primary) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <option value="">{t("universitiesPage.all")}</option>
            {CYCLES.map((c) => (
              <option key={c} value={c}>
                {t(`universitiesPage.cycles.${c}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        variant="danger"
        disabled={!hasFilters}
        className="text-xs px-3 py-1.5 sm:w-auto"
        onClick={() => {
          setEntityFilter("");
          setOwnershipFilter("");
          setCycleFilter("");
        }}
      >
        {t("universitiesPage.clearFilters")}
      </Button>
      <form
        onSubmit={(e) => void handleSearch(e)}
        className="flex flex-col sm:flex-row gap-2 w-full max-w-lg"
      >
        <div className="flex flex-1 items-center gap-2 px-3 rounded-md shadow-sm bg-(--surface-2) border border-(--border-input) [box-shadow:inset_0_1px_0_rgba(255,255,255,0.28)] transition duration-150 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--focus-ring) has-user-invalid:border-red-500">
          <span className="text-(--text-muted)" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
            placeholder={t("universitiesPage.searchAllPlaceholder")}
            required
            minLength={2}
            maxLength={100}
            className="flex-1 min-w-0 py-2 bg-transparent text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none sm:text-sm"
            aria-label={t("universitiesPage.search")}
          />
          <button
            type="button"
            aria-label={t("universitiesPage.clearSearch")}
            onClick={handleClear}
            className={`p-1 rounded cursor-pointer text-(--text-secondary) hover:text-(--text-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) ${
              searchInput === "" ? "invisible" : "visible"
            }`}
          >
            <ClearIcon />
          </button>
        </div>
        <Button
          type="submit"
          loading={loading}
          className="w-full self-center sm:max-w-28 sm:self-auto"
        >
          {t("universitiesPage.search")}
        </Button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        results !== null &&
        (noResultsAtAll ? (
          <div className="flex flex-col items-center gap-2 py-8 text-(--text-muted)">
            <span className="text-4xl" aria-hidden="true">
              🔍
            </span>
            <p>{t("universitiesPage.noResultsAtAll")}</p>
          </div>
        ) : (
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
                {groupBy(results.faculties, (f) => f.university.name).map(
                  (g) => (
                    <ResultGroup key={g.key} label={g.key}>
                      {g.items.map((f) => (
                        <FacultyResult key={f.id} faculty={f} />
                      ))}
                    </ResultGroup>
                  ),
                )}
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
                {groupBy(results.tracks, (tr) => tr.studyProgram.name).map(
                  (g) => (
                    <ResultGroup key={g.key} label={g.key}>
                      {g.items.map((tr) => (
                        <TrackResult key={tr.id} track={tr} t={t} />
                      ))}
                    </ResultGroup>
                  ),
                )}
              </div>
            </ResultSection>
          </>
        ))
      )}
    </div>
  );
}

export { UnifiedSearch };

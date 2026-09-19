import { SearchIcon, XIcon } from "../sharedComponents/icons";
import { useState, use, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../sharedComponents/Spinner";
import { UniversityCard } from "./UniversityCard";
import { ResultGroup } from "./ResultGroup";
import { FilterPanel } from "./FilterPanel";
import { SearchResults } from "./SearchResults";
import { groupBy } from "./utils/groupBy";
import {
  searchAll,
  fetchAllUniversities,
  SearchFailedError,
} from "./utils/search";
import { notificationMessageKey } from "../../utils/apiError";

import type { UnifiedSearchResults } from "../../schemas/university";
import type { UniversityListItem } from "../../schemas/university";
import type { Entity, Ownership, StudyCycle } from "../../schemas/domain";

const SEARCH_DEBOUNCE_MS = 400;

type ViewState =
  | { kind: "idle" }
  | { kind: "browse"; universities: UniversityListItem[] }
  | { kind: "search"; results: UnifiedSearchResults };

function UnifiedSearch() {
  const { t, addNotification } = use(RootContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialLoadDone = useRef(false);
  const [filtersOpen, setFiltersOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasEntity = params.has("entity");
    const hasOwnership = params.has("ownership");
    const hasCycle = params.getAll("cycle").length > 0;
    return hasEntity || hasOwnership || hasCycle;
  });

  const searchInput = searchParams.get("q") ?? "";
  const entityFilter = (searchParams.get("entity") ?? "") as Entity | "";
  const ownershipFilter = (searchParams.get("ownership") ?? "") as
    Ownership | "";
  const cycleFilters = searchParams.getAll("cycle") as StudyCycle[];

  const hasFilters =
    entityFilter !== "" || ownershipFilter !== "" || cycleFilters.length > 0;
  const hasSearchTerm = searchInput.trim().length > 0;

  function updateParams(updates: Record<string, string | string[] | null>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          next.delete(key);
          if (value === null || value === "") continue;
          if (Array.isArray(value)) {
            for (const v of value) next.append(key, v);
          } else {
            next.set(key, value);
          }
        }
        return next;
      },
      { replace: true },
    );
  }

  const executeSearch = useCallback(
    async (
      term: string | undefined,
      filters: {
        entity?: string;
        ownership?: string;
        cycle?: string[];
      },
    ) => {
      try {
        setLoading(true);
        const results = await searchAll(term, {
          entity: filters.entity ?? undefined,
          ownership: filters.ownership ?? undefined,
          cycle: filters.cycle?.length ? filters.cycle : undefined,
        });
        setView({ kind: "search", results });
      } catch (error) {
        addNotification({
          type: "error",
          message: t(
            notificationMessageKey(
              error instanceof SearchFailedError ? error.code : undefined,
              "messages.universities.searchError",
            ),
          ),
        });
      } finally {
        setLoading(false);
      }
    },
    [addNotification, t],
  );

  const loadDefaultBrowse = useCallback(async () => {
    try {
      setLoading(true);
      const universities = await fetchAllUniversities();
      setView({ kind: "browse", universities });
    } catch (error) {
      addNotification({
        type: "error",
        message: t(
          notificationMessageKey(
            error instanceof SearchFailedError ? error.code : undefined,
            "messages.universities.loadError",
          ),
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, t]);

  const triggerSearch = useCallback(
    (term: string, entity: string, ownership: string, cycle: string[]) => {
      const trimmed = term.trim();
      const hasText = trimmed.length > 0;
      const hasAnyFilter =
        entity !== "" || ownership !== "" || cycle.length > 0;

      if (hasText && trimmed.length < 2) return;

      if (!hasText && !hasAnyFilter) {
        void loadDefaultBrowse();
        return;
      }

      void executeSearch(hasText ? trimmed : undefined, {
        entity: entity || undefined,
        ownership: ownership || undefined,
        cycle,
      });
    },
    [executeSearch, loadDefaultBrowse],
  );

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const q = searchParams.get("q") ?? "";
    const entity = searchParams.get("entity") ?? "";
    const ownership = searchParams.get("ownership") ?? "";
    const cycle = searchParams.getAll("cycle");
    const hasAnyParam = q.trim() || entity || ownership || cycle.length > 0;

    if (hasAnyParam) {
      triggerSearch(q, entity, ownership, cycle); // eslint-disable-line react-hooks/set-state-in-effect
    } else {
      void loadDefaultBrowse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  function handleInputChange(value: string) {
    updateParams({ q: value || null });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSearch(value, entityFilter, ownershipFilter, cycleFilters);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterChange(key: string, value: string | string[] | null) {
    updateParams({ [key]: value });

    const nextEntity =
      key === "entity" ? ((value as string | null) ?? "") : entityFilter;
    const nextOwnership =
      key === "ownership" ? ((value as string | null) ?? "") : ownershipFilter;
    const nextCycle =
      key === "cycle" ? ((value as string[] | null) ?? []) : cycleFilters;

    triggerSearch(searchInput, nextEntity, nextOwnership, nextCycle);
  }

  function handleCycleChange(value: string, checked: boolean) {
    const next = checked
      ? [...cycleFilters, value]
      : cycleFilters.filter((c) => c !== value);
    handleFilterChange("cycle", next);
  }

  function handleClear() {
    updateParams({ q: null });
    clearTimeout(debounceRef.current);
    triggerSearch("", entityFilter, ownershipFilter, cycleFilters);
    inputRef.current?.focus();
  }

  function handleClearAll() {
    clearTimeout(debounceRef.current);
    setSearchParams(new URLSearchParams(), { replace: true });
    void loadDefaultBrowse();
  }

  return (
    <div className="flex flex-col gap-4 w-full items-center justify-center">
      <p className="text-sm text-center text-(--text-secondary) max-w-lg">
        {t("universitiesPage.searchHint")}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
        <div className="flex flex-1 items-center gap-2 px-3 rounded-md shadow-sm bg-(--surface-2) border border-(--border-input) [box-shadow:inset_0_1px_0_rgba(255,255,255,0.28)] transition duration-150 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--focus-ring)">
          <span className="text-(--text-muted)" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={searchInput}
            onChange={(e) => {
              handleInputChange(e.target.value);
            }}
            placeholder={t("universitiesPage.searchAllPlaceholder")}
            maxLength={100}
            className="flex-1 min-w-0 py-2 bg-transparent text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none sm:text-sm"
            aria-label={t("universitiesPage.search")}
          />
          {loading && <Spinner size="sm" />}
          <button
            type="button"
            aria-label={t("universitiesPage.clearSearch")}
            onClick={handleClear}
            className={`p-1 rounded cursor-pointer text-(--text-secondary) hover:text-(--text-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) ${
              searchInput === "" ? "invisible" : "visible"
            }`}
          >
            <XIcon />
          </button>
        </div>
      </div>

      <FilterPanel
        entityFilter={entityFilter}
        ownershipFilter={ownershipFilter}
        cycleFilters={cycleFilters}
        filtersOpen={filtersOpen}
        onToggleFilters={() => {
          setFiltersOpen((prev) => !prev);
        }}
        onFilterChange={handleFilterChange}
        onCycleChange={handleCycleChange}
        t={t}
      />

      {(hasFilters || hasSearchTerm) && (
        <Button
          variant="danger"
          className="text-xs px-3 py-1.5 sm:w-auto"
          onClick={handleClearAll}
        >
          {t("universitiesPage.clearFilters")}
        </Button>
      )}

      {loading && view.kind === "idle" ? (
        <Spinner />
      ) : view.kind === "browse" ? (
        view.universities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-(--text-muted)">
            <SearchIcon size={36} />
            <p>{t("universitiesPage.noResults")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {groupBy(view.universities, (u) =>
              t(`universitiesPage.ownershipGroup.${u.ownership}`),
            ).map((group) => (
              <ResultGroup
                key={group.key}
                label={group.key}
                collapsible
                count={group.items.length}
              >
                {group.items.map((u) => (
                  <UniversityCard key={u.id} university={u} />
                ))}
              </ResultGroup>
            ))}
          </div>
        )
      ) : view.kind === "search" ? (
        <SearchResults results={view.results} t={t} />
      ) : null}
    </div>
  );
}

export { UnifiedSearch };

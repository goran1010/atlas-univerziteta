import { useState, use, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { searchAll, SearchFailedError } from "./utils/search";
import { notificationMessageKey } from "../../utils/apiError";

import {
  entitySchema,
  ownershipSchema,
  searchTypeSchema,
  studyCycleSchema,
} from "../../schemas/domain";

import type { UnifiedSearchResults } from "../../schemas/university";
import type {
  Entity,
  Ownership,
  SearchType,
  StudyCycle,
} from "../../schemas/domain";

const SEARCH_DEBOUNCE_MS = 400;

type ViewState =
  | { kind: "idle" }
  | { kind: "search"; results: UnifiedSearchResults; hadTerm: boolean };

// All search-page state and behavior: URL params are the source of truth for
// filters, local state backs the input, and every change funnels through
// triggerSearch. The UnifiedSearch component renders what this returns.
function useUnifiedSearch() {
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
    const hasType = params.getAll("type").length > 0;
    return hasEntity || hasOwnership || hasCycle || hasType;
  });

  // local state backs the input: deriving it from the URL would re-render
  // the field through an async router update on every keystroke, jumping the
  // cursor to the end and breaking mobile autocorrect
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") ?? "",
  );
  const entityParsed = entitySchema.safeParse(searchParams.get("entity"));
  const entityFilter: Entity | "" = entityParsed.success
    ? entityParsed.data
    : "";
  const ownershipParsed = ownershipSchema.safeParse(
    searchParams.get("ownership"),
  );
  const ownershipFilter: Ownership | "" = ownershipParsed.success
    ? ownershipParsed.data
    : "";
  const cycleFilters = searchParams
    .getAll("cycle")
    .filter(
      (value): value is StudyCycle => studyCycleSchema.safeParse(value).success,
    );
  const typeFilters = searchParams
    .getAll("type")
    .filter(
      (value): value is SearchType => searchTypeSchema.safeParse(value).success,
    );
  const browseAll = searchParams.get("browse") === "all";

  const hasFilters =
    entityFilter !== "" ||
    ownershipFilter !== "" ||
    cycleFilters.length > 0 ||
    typeFilters.length > 0;
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
        type?: string[];
      },
    ) => {
      try {
        setLoading(true);
        const results = await searchAll(term, {
          entity: filters.entity ?? undefined,
          ownership: filters.ownership ?? undefined,
          cycle: filters.cycle?.length ? filters.cycle : undefined,
          type: filters.type?.length ? filters.type : undefined,
        });
        setView({ kind: "search", results, hadTerm: term !== undefined });
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

  const triggerSearch = useCallback(
    (
      term: string,
      entity: string,
      ownership: string,
      cycle: string[],
      types: string[],
      browse = false,
    ) => {
      const trimmed = term.trim();
      const hasText = trimmed.length > 0;
      const hasAnyFilter =
        entity !== "" ||
        ownership !== "" ||
        cycle.length > 0 ||
        types.length > 0;

      if (hasText && trimmed.length < 2) return;

      if (!hasText && !hasAnyFilter && !browse) {
        setView({ kind: "idle" });
        return;
      }

      // a bare Browse All shows universities only (their cards drill down);
      // the type filter state stays empty so typing searches everything
      const browseOnly = !hasText && !hasAnyFilter && browse;

      void executeSearch(hasText ? trimmed : undefined, {
        entity: entity || undefined,
        ownership: ownership || undefined,
        cycle,
        type: browseOnly ? ["university"] : types,
      });
    },
    [executeSearch],
  );

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const hasAnyParam =
      searchInput.trim() ||
      entityFilter ||
      ownershipFilter ||
      cycleFilters.length > 0 ||
      typeFilters.length > 0 ||
      browseAll;

    if (hasAnyParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      triggerSearch(
        searchInput,
        entityFilter,
        ownershipFilter,
        cycleFilters,
        typeFilters,
        browseAll,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  // reflect external URL changes (e.g. nav links) into the input, but never
  // while the user is typing in it - that would recreate the cursor jump
  const urlQuery = searchParams.get("q") ?? "";
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    // eslint-disable-next-line react-x/set-state-in-effect
    setSearchInput(urlQuery);
  }, [urlQuery]);

  function handleInputChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || null });
      triggerSearch(
        value,
        entityFilter,
        ownershipFilter,
        cycleFilters,
        typeFilters,
        browseAll,
      );
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterChange(
    key: "entity" | "ownership",
    value: string | null,
  ) {
    updateParams({ [key]: value });

    const nextEntity = key === "entity" ? (value ?? "") : entityFilter;
    const nextOwnership = key === "ownership" ? (value ?? "") : ownershipFilter;

    triggerSearch(
      searchInput,
      nextEntity,
      nextOwnership,
      cycleFilters,
      typeFilters,
      browseAll,
    );
  }

  function handleCycleChange(value: string, checked: boolean) {
    const next = checked
      ? [...cycleFilters, value]
      : cycleFilters.filter((c) => c !== value);
    updateParams({ cycle: next });
    triggerSearch(
      searchInput,
      entityFilter,
      ownershipFilter,
      next,
      typeFilters,
      browseAll,
    );
  }

  function handleTypeChange(value: string, checked: boolean) {
    const next = checked
      ? [...typeFilters, value]
      : typeFilters.filter((type) => type !== value);
    updateParams({ type: next });
    triggerSearch(
      searchInput,
      entityFilter,
      ownershipFilter,
      cycleFilters,
      next,
      browseAll,
    );
  }

  function handleShowAll(type: SearchType) {
    updateParams({ type });
    // open the panel so the applied type filter is visible, not hidden state
    setFiltersOpen(true);
    triggerSearch(
      searchInput,
      entityFilter,
      ownershipFilter,
      cycleFilters,
      [type],
      browseAll,
    );
  }

  function handleBrowseAll() {
    updateParams({ browse: "all" });
    triggerSearch(
      searchInput,
      entityFilter,
      ownershipFilter,
      cycleFilters,
      typeFilters,
      true,
    );
  }

  function handleClear() {
    setSearchInput("");
    updateParams({ q: null });
    clearTimeout(debounceRef.current);
    triggerSearch(
      "",
      entityFilter,
      ownershipFilter,
      cycleFilters,
      typeFilters,
      browseAll,
    );
    inputRef.current?.focus();
  }

  function handleClearAll() {
    setSearchInput("");
    clearTimeout(debounceRef.current);
    setSearchParams(new URLSearchParams(), { replace: true });
    setView({ kind: "idle" });
  }

  return {
    t,
    view,
    loading,
    inputRef,
    searchInput,
    entityFilter,
    ownershipFilter,
    cycleFilters,
    typeFilters,
    filtersOpen,
    setFiltersOpen,
    hasFilters,
    hasSearchTerm,
    handleInputChange,
    handleFilterChange,
    handleCycleChange,
    handleTypeChange,
    handleShowAll,
    handleBrowseAll,
    handleClear,
    handleClearAll,
  };
}

export { useUnifiedSearch };

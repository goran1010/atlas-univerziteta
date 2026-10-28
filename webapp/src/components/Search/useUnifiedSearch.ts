import { useState, use, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { searchAll, SearchFailedError } from "./utils/search";
import { notificationMessage } from "../../utils/apiError";

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
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);
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
        entity?: string | undefined;
        ownership?: string | undefined;
        cycle?: string[] | undefined;
        type?: string[] | undefined;
      },
    ) => {
      // a newer search supersedes any in-flight one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        const results = await searchAll(
          term,
          {
            entity: filters.entity ?? undefined,
            ownership: filters.ownership ?? undefined,
            cycle: filters.cycle?.length ? filters.cycle : undefined,
            type: filters.type?.length ? filters.type : undefined,
          },
          controller.signal,
        );
        setView({ kind: "search", results, hadTerm: term !== undefined });
      } catch (error) {
        if (controller.signal.aborted) return;
        addNotification({
          type: "error",
          message: notificationMessage(
            t,
            "messages.universities.searchError",
            error instanceof SearchFailedError ? error.serverError : null,
          ),
        });
      } finally {
        // the superseding search owns the loading flag now
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [addNotification, t],
  );

  // No abort-on-unmount: StrictMode's mount/unmount/remount would cancel the
  // one-time deep-link search (initialLoadDone stays set, nothing re-fires).
  // A fetch resolving after unmount is harmless.

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
        // eslint-disable-next-line react-x/set-state-in-effect -- reached synchronously from the params effect, whose purpose is syncing URL params into view state
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

  // The URL is the single search trigger: handlers only write params, and
  // this effect runs the search - the same path covers deep links, the
  // page's own handlers, and in-app navigation to /search with new params.
  const paramsKey = searchParams.toString();
  const urlQuery = searchParams.get("q") ?? "";
  useEffect(() => {
    if (paramsKey === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect -- syncing URL params into view state is this effect's purpose
      setView({ kind: "idle" });
      return;
    }

    triggerSearch(
      urlQuery,
      entityFilter,
      ownershipFilter,
      cycleFilters,
      typeFilters,
      browseAll,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps -- every filter value above derives from paramsKey
  }, [paramsKey, triggerSearch]);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  // reflect external URL changes (e.g. nav links) into the input, but never
  // while the user is typing in it - that would recreate the cursor jump
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setSearchInput(urlQuery);
  }, [urlQuery]);

  function handleInputChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || null });
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleFilterChange(
    key: "entity" | "ownership",
    value: string | null,
  ) {
    updateParams({ [key]: value });
  }

  function handleCycleChange(value: string, checked: boolean) {
    const next = checked
      ? [...cycleFilters, value]
      : cycleFilters.filter((c) => c !== value);
    updateParams({ cycle: next });
  }

  function handleTypeChange(value: string, checked: boolean) {
    const next = checked
      ? [...typeFilters, value]
      : typeFilters.filter((type) => type !== value);
    updateParams({ type: next });
  }

  function handleBrowseAll() {
    updateParams({ browse: "all" });
  }

  function handleClear() {
    setSearchInput("");
    clearTimeout(debounceRef.current);
    updateParams({ q: null });
    inputRef.current?.focus();
  }

  function handleClearAll() {
    setSearchInput("");
    clearTimeout(debounceRef.current);
    setSearchParams(new URLSearchParams(), { replace: true });
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
    handleBrowseAll,
    handleClear,
    handleClearAll,
  };
}

export { useUnifiedSearch };

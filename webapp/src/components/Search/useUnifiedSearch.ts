import { useState, use, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { searchAll, SearchFailedError } from "./utils/search";
import { notificationMessage } from "../../utils/apiError";

import { countrySchema } from "../../schemas/domain";

import type { UnifiedSearchResults } from "../../schemas/university";
import type { Country } from "../../schemas/domain";

const SEARCH_DEBOUNCE_MS = 400;

type ViewState =
  | { kind: "idle" }
  | { kind: "search"; results: UnifiedSearchResults; hadTerm: boolean };

function useUnifiedSearch() {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") ?? "",
  );
  const countryParsed = countrySchema.safeParse(searchParams.get("country"));
  const countryFilter: Country | "" = countryParsed.success
    ? countryParsed.data
    : "";
  const browseAll = searchParams.get("browse") === "all";
  const hasSearchTerm = searchInput.trim().length > 0;

  function updateParams(updates: Record<string, string | null>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          next.delete(key);
          if (value === null || value === "") continue;
          next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  }

  const executeSearch = useCallback(
    async (term: string | undefined, country?: string, type?: string[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        const results = await searchAll(
          term,
          {
            country: country ?? undefined,
            type: type?.length ? type : undefined,
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
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [addNotification, t],
  );

  const triggerSearch = useCallback(
    (term: string, country: string, browse: boolean) => {
      const trimmed = term.trim();
      const hasText = trimmed.length > 0;
      const hasCountry = country !== "";

      if (hasText && trimmed.length < 2) return;

      if (!hasText && !hasCountry && !browse) {
        // eslint-disable-next-line react-x/set-state-in-effect -- reached synchronously from the params effect, whose purpose is syncing URL params into view state
        setView({ kind: "idle" });
        return;
      }

      void executeSearch(
        hasText ? trimmed : undefined,
        country || undefined,
        browse && !hasText ? ["university"] : undefined,
      );
    },
    [executeSearch],
  );

  const paramsKey = searchParams.toString();
  const urlQuery = searchParams.get("q") ?? "";
  useEffect(() => {
    if (paramsKey === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect -- syncing URL params into view state is this effect's purpose
      setView({ kind: "idle" });
      return;
    }

    triggerSearch(urlQuery, countryFilter, browseAll);
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps -- browseAll derives from paramsKey
  }, [paramsKey, triggerSearch]);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

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

  function handleCountryChange(value: string) {
    updateParams({ country: value || null });
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
    countryFilter,
    hasSearchTerm,
    handleInputChange,
    handleCountryChange,
    handleBrowseAll,
    handleClear,
    handleClearAll,
  };
}

export { useUnifiedSearch };

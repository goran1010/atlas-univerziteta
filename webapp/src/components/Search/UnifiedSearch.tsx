import { SearchIcon, XIcon } from "../sharedComponents/icons";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../sharedComponents/Spinner";
import { FilterPanel } from "./FilterPanel";
import { SearchResults } from "./SearchResults";
import { useUnifiedSearch } from "./useUnifiedSearch";

function UnifiedSearch() {
  const {
    t,
    view,
    loading,
    inputRef,
    searchInput,
    countryFilter,
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
  } = useUnifiedSearch();

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
            className={`p-2 sm:p-1 text-lg rounded cursor-pointer text-(--text-secondary) hover:text-(--text-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) ${
              searchInput === "" ? "invisible" : "visible"
            }`}
          >
            <XIcon />
          </button>
        </div>
      </div>

      <FilterPanel
        countryFilter={countryFilter}
        entityFilter={entityFilter}
        ownershipFilter={ownershipFilter}
        cycleFilters={cycleFilters}
        typeFilters={typeFilters}
        filtersOpen={filtersOpen}
        onToggleFilters={() => {
          setFiltersOpen((prev) => !prev);
        }}
        onFilterChange={handleFilterChange}
        onCycleChange={handleCycleChange}
        onTypeChange={handleTypeChange}
        t={t}
      />

      {(hasFilters || hasSearchTerm || view.kind !== "idle") && (
        <Button
          variant="danger"
          className="text-xs px-3 py-2 sm:py-1.5 w-full max-w-xs sm:w-auto"
          onClick={handleClearAll}
        >
          {t("universitiesPage.resetSearch")}
        </Button>
      )}

      {/* announce result counts to screen readers on every search */}
      <p aria-live="polite" className="sr-only">
        {view.kind === "search" &&
          `${t("universitiesPage.searchResultsAnnouncement")} ${[
            `${String(view.results.universities.length)} ${t("universitiesPage.universitiesSection")}`,
            `${String(view.results.faculties.length)} ${t("universitiesPage.facultiesSection")}`,
            `${String(view.results.studyPrograms.length)} ${t("universitiesPage.studyProgramsSection")}`,
          ].join(", ")}`}
      </p>

      {loading && view.kind === "idle" ? (
        <Spinner page />
      ) : view.kind === "idle" ? (
        <Button
          variant="secondary"
          className="px-6 py-2.5 w-full max-w-xs sm:w-auto"
          onClick={handleBrowseAll}
        >
          {t("universitiesPage.browseAll")}
        </Button>
      ) : (
        <SearchResults results={view.results} hadTerm={view.hadTerm} t={t} />
      )}
    </div>
  );
}

export { UnifiedSearch };

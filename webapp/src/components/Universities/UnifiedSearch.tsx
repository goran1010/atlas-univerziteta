import {
  useState,
  use,
  useEffect,
  useRef,
  type ReactNode,
  type SubmitEvent,
} from "react";
import { RootContext } from "../../contextData/RootContext";
import { Input } from "../sharedComponents/Input";
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
  return (
    <section className="w-full flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-(--text-primary)">
        {heading}
        {!isEmpty && (
          <span className="ml-2 text-sm font-normal text-(--text-muted)">
            ({count})
          </span>
        )}
      </h2>
      {isEmpty ? (
        <p className="text-(--text-muted)">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}

function UnifiedSearch() {
  const { t, addNotification, serverStatus } = use(RootContext);
  const [results, setResults] = useState<UnifiedSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input only on devices with a precise pointer
  // (mouse/trackpad) so mobile users don't get the keyboard popping up.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  async function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    const searchTerm = searchTermSchema.safeParse(
      inputRef.current?.value ?? "",
    );
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
      setResults(await searchAll(term, serverStatus));
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
      <form
        onSubmit={(e) => void handleSearch(e)}
        className="flex flex-col sm:flex-row gap-2 w-full max-w-lg"
      >
        <Input
          ref={inputRef}
          type="search"
          placeholder={t("universitiesPage.searchAllPlaceholder")}
          minLength={2}
          maxLength={100}
          className="flex-1"
          aria-label={t("universitiesPage.search")}
        />
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

import { use, useEffect, useState } from "react";
import { z } from "zod";
import { RootContext } from "../../contextData/RootContext";
import { fetchPublicResponse } from "../../utils/fetchPublic";
import { COUNTRIES } from "../../schemas/domain";

const totalSchema = z.object({ total: z.number().int().nonnegative() });

interface Counts {
  universities: number;
  faculties: number;
  studyPrograms: number;
}

// kept for the page's lifetime, so returning to the home page shows the
// counts at once instead of fetching them again
let cachedCounts: Counts | null = null;

async function fetchTotal(path: string, signal: AbortSignal) {
  const outcome = await fetchPublicResponse(
    `${path}?limit=1`,
    totalSchema,
    signal,
  );
  if (!outcome.ok) {
    throw new Error(`${path} answered ${outcome.status.toString()}`);
  }
  return outcome.result.total;
}

// The size of the dataset under the home heading. The line keeps its height
// while loading (two lines on phones, where it wraps) and stays empty if a
// count fails - search works without it.
function DatasetCounts() {
  const { tCount } = use(RootContext);
  const [counts, setCounts] = useState<Counts | null>(cachedCounts);

  useEffect(() => {
    if (cachedCounts) return;
    const controller = new AbortController();

    Promise.all([
      fetchTotal("/api/v1/universities", controller.signal),
      fetchTotal("/api/v1/faculties", controller.signal),
      fetchTotal("/api/v1/study-programs", controller.signal),
    ])
      .then(([universities, faculties, studyPrograms]) => {
        cachedCounts = { universities, faculties, studyPrograms };
        setCounts(cachedCounts);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("Could not load the dataset counts:", error);
      });

    return () => {
      controller.abort();
    };
  }, []);

  // a number and its word never split across lines
  const parts = counts
    ? [
        `${counts.universities.toString()}\u00a0${tCount("universitiesPage.universityCount", counts.universities)}`,
        `${counts.faculties.toString()}\u00a0${tCount("universitiesPage.facultyCount", counts.faculties)}`,
        `${counts.studyPrograms.toString()}\u00a0${tCount("universitiesPage.studyProgramCount", counts.studyPrograms)}`,
        `${COUNTRIES.length.toString()}\u00a0${tCount("universitiesPage.countryCount", COUNTRIES.length)}`,
      ]
    : [];

  return (
    <p className="min-h-10 sm:min-h-5 text-sm text-center text-(--text-muted)">
      {parts.join(" · ")}
    </p>
  );
}

export { DatasetCounts };

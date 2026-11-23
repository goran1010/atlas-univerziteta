import { fetchPublicResponse } from "../../../utils/fetchPublic";
import {
  unifiedSearchResponseSchema,
  universityListResponseSchema,
} from "../../../schemas/university";

import type { ApiError } from "../../../schemas/api";
import type { UnifiedSearchResults } from "../../../schemas/university";

interface SearchFilters {
  country?: string | undefined;
  type?: string[] | undefined;
}

async function searchAll(
  term: string | undefined,
  filters?: SearchFilters,
  signal?: AbortSignal,
): Promise<UnifiedSearchResults> {
  const params = new URLSearchParams();
  if (term) params.set("searchTerm", term);
  if (filters?.country) params.set("country", filters.country);
  if (filters?.type) {
    for (const type of filters.type) {
      params.append("type", type);
    }
  }

  const outcome = await fetchPublicResponse(
    `/api/v1/search?${params.toString()}`,
    unifiedSearchResponseSchema,
    signal,
  );

  if (outcome.ok) return outcome.result.data;

  throw new SearchFailedError(outcome.status, outcome.error);
}

// the API's largest page; Browse All requests every page to list them all
const BROWSE_PAGE_SIZE = 100;

async function fetchUniversityPage(
  page: number,
  country: string | undefined,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    limit: String(BROWSE_PAGE_SIZE),
    page: String(page),
  });
  if (country) params.set("country", country);

  const outcome = await fetchPublicResponse(
    `/api/v1/universities?${params.toString()}`,
    universityListResponseSchema,
    signal,
  );

  if (outcome.ok) return outcome.result;

  throw new SearchFailedError(outcome.status, outcome.error);
}

async function browseUniversities(
  country: string | undefined,
  signal?: AbortSignal,
): Promise<UnifiedSearchResults> {
  const firstPage = await fetchUniversityPage(1, country, signal);
  const otherPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchUniversityPage(index + 2, country, signal),
    ),
  );
  const universities = [firstPage, ...otherPages].flatMap((page) => page.data);

  return {
    universities,
    faculties: [],
    studyPrograms: [],
    direct: {
      universities: universities.length,
      faculties: 0,
      studyPrograms: 0,
    },
  };
}

class SearchFailedError extends Error {
  readonly serverError: ApiError | null;

  constructor(status: number, serverError: ApiError | null) {
    const details = serverError?.message ?? "no error details";
    super(`Search failed with status ${String(status)}: ${details}`);
    this.name = "SearchFailedError";
    this.serverError = serverError;
  }

  get code(): string | undefined {
    return this.serverError?.code;
  }
}

export { searchAll, browseUniversities, SearchFailedError };

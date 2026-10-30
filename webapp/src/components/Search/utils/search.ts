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

  if (outcome.error) {
    console.warn("Search failed:", outcome.error.message);
  }
  throw new SearchFailedError(outcome.error);
}

async function browseUniversities(
  country: string | undefined,
  signal?: AbortSignal,
): Promise<UnifiedSearchResults> {
  const params = new URLSearchParams({ limit: "100" });
  if (country) params.set("country", country);

  const outcome = await fetchPublicResponse(
    `/api/v1/universities?${params.toString()}`,
    universityListResponseSchema,
    signal,
  );

  if (outcome.ok) {
    return {
      universities: outcome.result.data,
      faculties: [],
      studyPrograms: [],
      direct: {
        universities: outcome.result.data.length,
        faculties: 0,
        studyPrograms: 0,
      },
    };
  }

  if (outcome.error) {
    console.warn("Browse failed:", outcome.error.message);
  }
  throw new SearchFailedError(outcome.error);
}

class SearchFailedError extends Error {
  readonly serverError: ApiError | null;

  constructor(serverError: ApiError | null) {
    super("Search failed");
    this.name = "SearchFailedError";
    this.serverError = serverError;
  }

  get code(): string | undefined {
    return this.serverError?.code;
  }
}

export { searchAll, browseUniversities, SearchFailedError };

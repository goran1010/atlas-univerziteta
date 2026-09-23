import { SERVER_URL } from "../../../utils/envConfig";
import { readApiError } from "../../../schemas/api";
import { unifiedSearchResponseSchema } from "../../../schemas/university";

import type { UnifiedSearchResults } from "../../../schemas/university";

interface SearchFilters {
  entity?: string;
  ownership?: string;
  cycle?: string[];
  type?: string[];
}

async function searchAll(
  term: string | undefined,
  filters?: SearchFilters,
): Promise<UnifiedSearchResults> {
  const params = new URLSearchParams();
  if (term) params.set("searchTerm", term);
  if (filters?.entity) params.set("entity", filters.entity);
  if (filters?.ownership) params.set("ownership", filters.ownership);
  if (filters?.cycle) {
    for (const c of filters.cycle) {
      params.append("cycle", c);
    }
  }
  if (filters?.type) {
    for (const type of filters.type) {
      params.append("type", type);
    }
  }

  const res = await fetch(`${SERVER_URL}/api/v1/search?${params.toString()}`, {
    method: "GET",
    mode: "cors",
  });

  if (res.ok) {
    const result = unifiedSearchResponseSchema.parse(await res.json());
    return result.data;
  }
  const serverError = readApiError(await res.json());
  if (serverError) {
    console.warn("Search failed:", serverError.message);
  }
  throw new SearchFailedError(serverError?.code);
}

class SearchFailedError extends Error {
  readonly code?: string;

  constructor(code?: string) {
    super("Search failed");
    this.name = "SearchFailedError";
    this.code = code;
  }
}

export { searchAll, SearchFailedError };

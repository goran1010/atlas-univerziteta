import { SERVER_URL } from "../../../utils/envConfig";
import { readErrorMessage } from "../../../schemas/api";
import { unifiedSearchResponseSchema } from "../../../schemas/university";
import { guardedFetch } from "../../../utils/guardedFetch";

import type { UnifiedSearchResults } from "../../../schemas/university";
import type { ServerStatus } from "../../../utils/serverStatus";

const EMPTY_RESULTS: UnifiedSearchResults = {
  universities: [],
  faculties: [],
  studyPrograms: [],
  tracks: [],
};

interface SearchFilters {
  entity?: string;
  ownership?: string;
  cycle?: string;
}

async function searchAll(
  term: string,
  serverStatus: ServerStatus,
  filters?: SearchFilters,
): Promise<UnifiedSearchResults> {
  const params = new URLSearchParams({ searchTerm: term });
  if (filters?.entity) params.set("entity", filters.entity);
  if (filters?.ownership) params.set("ownership", filters.ownership);
  if (filters?.cycle) params.set("cycle", filters.cycle);

  const res = await guardedFetch(
    `${SERVER_URL}/api/v1/search?${params.toString()}`,
    { method: "GET", mode: "cors" },
    { serverStatus },
  );

  if (res.ok) {
    const result = unifiedSearchResponseSchema.parse(await res.json());
    return result.data;
  }
  if (res.status === 404) {
    return EMPTY_RESULTS;
  }
  const serverMessage = readErrorMessage(await res.json());
  if (serverMessage) {
    console.warn("Search failed:", serverMessage);
  }
  throw new Error("Search failed");
}

export { searchAll };

import { SERVER_URL } from "../../../utils/envConfig";
import { readErrorMessage } from "../../../schemas/api";
import { unifiedSearchResponseSchema } from "../../../schemas/university";

import type { UnifiedSearchResults } from "../../../schemas/university";

const EMPTY_RESULTS: UnifiedSearchResults = {
  universities: [],
  faculties: [],
  studyPrograms: [],
  tracks: [],
};

async function searchAll(term: string): Promise<UnifiedSearchResults> {
  const res = await fetch(
    `${SERVER_URL}/api/v1/search?searchTerm=${encodeURIComponent(term)}`,
    { method: "GET", mode: "cors" },
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

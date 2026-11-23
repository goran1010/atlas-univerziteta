// The home page's current search, kept for this tab so a detail page's
// "Home" breadcrumb leads back to the results it was opened from. Only the
// search's own params are kept, not one-off ones like a login notice.
const LAST_SEARCH_KEY = "lastSearch";
const SEARCH_PARAMS = ["q", "country", "browse"];

function rememberSearch(params: URLSearchParams) {
  const kept = new URLSearchParams();
  for (const key of SEARCH_PARAMS) {
    const value = params.get(key);
    if (value) kept.set(key, value);
  }

  try {
    const query = kept.toString();
    if (query) sessionStorage.setItem(LAST_SEARCH_KEY, query);
    else sessionStorage.removeItem(LAST_SEARCH_KEY);
  } catch (error) {
    console.warn("Could not save the last search:", error);
  }
}

function homeWithLastSearch(): string {
  try {
    const query = sessionStorage.getItem(LAST_SEARCH_KEY);
    return query ? `/?${query}` : "/";
  } catch (error) {
    console.warn("Could not read the last search:", error);
    return "/";
  }
}

export { rememberSearch, homeWithLastSearch };

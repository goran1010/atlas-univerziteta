import {
  homeWithLastSearch,
  rememberSearch,
} from "../../../src/utils/lastSearch";

beforeEach(() => {
  sessionStorage.clear();
});

describe("lastSearch", () => {
  test("leads home when nothing was searched in this tab", () => {
    expect(homeWithLastSearch()).toBe("/");
  });

  test("keeps the search params and drops one-off ones", () => {
    rememberSearch(new URLSearchParams("q=medicina&country=BIH&login=success"));

    expect(homeWithLastSearch()).toBe("/?q=medicina&country=BIH");
  });

  test("keeps a browse listing", () => {
    rememberSearch(new URLSearchParams("browse=all&country=SRB"));

    expect(homeWithLastSearch()).toBe("/?country=SRB&browse=all");
  });

  test("forgets the search when it is cleared", () => {
    rememberSearch(new URLSearchParams("q=medicina"));
    rememberSearch(new URLSearchParams(""));

    expect(homeWithLastSearch()).toBe("/");
  });
});

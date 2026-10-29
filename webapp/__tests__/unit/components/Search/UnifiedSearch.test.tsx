import { render, screen, act, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import { UnifiedSearch } from "../../../../src/components/Search/UnifiedSearch";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

function buildSearchRouter(initialEntry = "/search") {
  const routes = [
    {
      path: "/search",
      element: (
        <RootContextProvider>
          <Notifications />
          <UnifiedSearch />
        </RootContextProvider>
      ),
    },
  ];

  return createMemoryRouter(routes, { initialEntries: [initialEntry] });
}

function Wrapper({ initialEntry = "/search" }: { initialEntry?: string }) {
  return <RouterProvider router={buildSearchRouter(initialEntry)} />;
}

const universityListItem = {
  id: 5,
  name: "University of Mostar",
  acronym: "SUM",
  city: "Mostar",
  country: "BIH",
  entity: "FBIH",
  ownership: "PRIVATE",
  foundedYear: "1977",
  website: "https://sum.ba",
  _count: { faculties: 3 },
};

const universityResult = {
  id: 5,
  name: "University of Mostar",
  acronym: "SUM",
  city: "Mostar",
  country: "BIH",
  entity: "FBIH",
  ownership: "PRIVATE",
  foundedYear: "1977",
  website: "https://sum.ba",
};

const facultyResult = {
  id: 3,
  name: "Faculty of Electrical Engineering",
  universityId: 1,
  city: "Sarajevo",
  university: {
    id: 1,
    name: "University of Sarajevo",
    acronym: "UNSA",
    city: "Sarajevo",
    country: "BIH",
    entity: "FBIH",
    ownership: "PUBLIC",
  },
};

const studyProgramResult = {
  id: 7,
  name: "Computer Science",
  facultyId: 3,
  cycle: "FIRST",
  ects: 180,
  tracks: [{ id: 70, name: "Software Engineering Track", ects: 180 }],
  faculty: {
    id: 3,
    name: "Faculty of Electrical Engineering",
    universityId: 1,
    university: {
      id: 1,
      name: "University of Sarajevo",
      acronym: "UNSA",
      city: "Sarajevo",
      country: "BIH",
      entity: "FBIH",
      ownership: "PUBLIC",
    },
  },
};

let searchRequests: URL[] = [];

function givenSearchResults(
  data: Partial<{
    universities: unknown[];
    faculties: unknown[];
    studyPrograms: unknown[];
    direct: Record<string, number>;
  }> = {},
) {
  server.use(
    http.get("*/api/v1/search", ({ request }) => {
      searchRequests.push(new URL(request.url));
      return HttpResponse.json({
        message: "Search results retrieved successfully.",
        data: {
          universities: [],
          faculties: [],
          studyPrograms: [],
          ...data,
        },
      });
    }),
  );
}

function renderSearch() {
  render(<Wrapper />);
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function typeSearch(
  user: ReturnType<typeof userEvent.setup>,
  term: string,
) {
  await user.type(screen.getByRole("searchbox", { name: /Search/i }), term);
  act(() => {
    vi.advanceTimersByTime(500);
  });
}

describe("UnifiedSearch", () => {
  beforeEach(() => {
    searchRequests = [];
    givenSearchResults();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("shows Browse All button on initial visit, clicking it loads universities", async () => {
    givenSearchResults({ universities: [universityListItem] });
    const user = renderSearch();

    const browseButton = screen.getByRole("button", { name: /Browse All/i });
    expect(browseButton).toBeInTheDocument();
    expect(searchRequests).toHaveLength(0);

    await user.click(browseButton);

    expect(
      await screen.findByText(/University of Mostar/i),
    ).toBeInTheDocument();
    expect(searchRequests).toHaveLength(1);
    // browsing shows universities only...
    expect(searchRequests[0]?.searchParams.getAll("type")).toContain(
      "university",
    );

    await typeSearch(user, "sarajevo");

    await waitFor(() => {
      expect(searchRequests).toHaveLength(2);
    });
    // ...but must not stick as a filter once the user types a term
    expect(searchRequests[1]?.searchParams.has("type")).toBe(false);
  });

  test("explains which terms are searched", () => {
    renderSearch();

    expect(screen.getByText(/Search universities, faculties/i)).toBeInTheDocument();
  });

  test("debounced search triggers after typing and renders results", async () => {
    givenSearchResults({
      universities: [universityResult],
      faculties: [facultyResult],
      studyPrograms: [studyProgramResult],
    });
    const user = renderSearch();

    await typeSearch(user, "sarajevo");

    await screen.findByRole("heading", { name: /^Universities/i });

    expect(searchRequests).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: /^Faculties/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Study programs/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^Tracks/i }),
    ).not.toBeInTheDocument();
    // tracks render inline on the program card instead
    expect(screen.getByText(/Software Engineering Track/i)).toBeInTheDocument();
  });

  test("ranks direct-match sections first and hints context-only matches", async () => {
    givenSearchResults({
      universities: [universityListItem],
      studyPrograms: [studyProgramResult],
      direct: { universities: 0, faculties: 0, studyPrograms: 1, tracks: 0 },
    });
    const user = renderSearch();

    await typeSearch(user, "medicina");

    await screen.findByRole("heading", { name: /^Study programs/i });
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]?.textContent).toMatch(/Study programs/);
    expect(headings[1]?.textContent).toMatch(/Universities/);

    // the context-only universities section starts collapsed as one
    // whole-box expander button
    expect(screen.queryByText(/University of Mostar/i)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Universities.*tap to expand/i }),
    );

    expect(
      await screen.findByText(/Matched through its faculties/i),
    ).toBeInTheDocument();
  });

  test("keeps the first section expanded when every section is context-only", async () => {
    givenSearchResults({
      universities: [universityListItem],
      studyPrograms: [studyProgramResult],
      direct: { universities: 0, faculties: 0, studyPrograms: 0 },
    });
    const user = renderSearch();

    await typeSearch(user, "medicina javni sar");

    // programs rank first; their content stays visible despite direct = 0
    expect(await screen.findByText(/Computer Science/i)).toBeInTheDocument();
    // the second context-only section still starts collapsed
    expect(screen.queryByText(/University of Mostar/i)).not.toBeInTheDocument();
  });

  test("shows no truncation UI: the section count is the result count", async () => {
    givenSearchResults({
      universities: [universityListItem],
    });
    const user = renderSearch();

    await typeSearch(user, "univerzitet");

    await screen.findByRole("heading", { name: /^Universities/i });
    expect(
      screen.queryByRole("button", { name: /Show all/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing first/i)).not.toBeInTheDocument();
  });

  test("clicking a country pill sends the country filter", async () => {
    givenSearchResults({ universities: [universityListItem] });
    const user = renderSearch();

    await user.click(
      screen.getByRole("button", { name: /Bosnia and Herzegovina/i }),
    );

    await waitFor(() => {
      expect(searchRequests).toHaveLength(1);
    });
    expect(searchRequests[0]?.searchParams.get("country")).toBe("BIH");
  });

  test("does not trigger search for short input (1 char)", async () => {
    const user = renderSearch();

    screen.getByRole("button", { name: /Browse All/i });

    await typeSearch(user, "a");

    expect(searchRequests).toHaveLength(0);
  });

  test("shows the faculty city in faculty results", async () => {
    givenSearchResults({ faculties: [facultyResult] });
    const user = renderSearch();

    await typeSearch(user, "sarajevo");

    await screen.findByText(/Faculty of Electrical Engineering/i);
    expect(screen.getByText("Sarajevo")).toBeInTheDocument();
  });

  test("renders combined no results message when nothing matches", async () => {
    const user = renderSearch();

    await typeSearch(user, "no-match-term");

    expect(
      await screen.findByText(/^No results found\.$/i),
    ).toBeInTheDocument();
  });

  test.each([
    [
      "a non-404 non-ok response",
      () =>
        HttpResponse.json(
          { error: { message: "Search exploded." } },
          { status: 500 },
        ),
    ],
    ["a thrown request", () => HttpResponse.error()],
    [
      "an invalid success payload",
      () =>
        HttpResponse.json({
          message: "Search results retrieved successfully.",
        }),
    ],
  ])("shows the search error message on %s", async (_label, resolver) => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    server.use(http.get("*/api/v1/search", resolver));
    const user = renderSearch();

    await typeSearch(user, "sarajevo");

    expect(
      await screen.findByText(
        /^Search did not complete\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
  });

  function mediaQueryList(matches: boolean): MediaQueryList {
    return {
      matches,
      media: "(pointer: fine)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => true,
    };
  }

  test("autofocuses the search input on fine-pointer devices", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue(mediaQueryList(true));

    renderSearch();

    expect(screen.getByRole("searchbox", { name: /Search/i })).toHaveFocus();
  });

  test("does not autofocus the search input without a fine pointer", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue(mediaQueryList(false));

    renderSearch();

    expect(
      screen.getByRole("searchbox", { name: /Search/i }),
    ).not.toHaveFocus();
  });
});

describe("UnifiedSearch URL navigation", () => {
  beforeEach(() => {
    searchRequests = [];
    givenSearchResults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("navigating to /search with new params while on it re-runs the search", async () => {
    givenSearchResults({ universities: [universityListItem] });
    const router = buildSearchRouter("/search?q=medicina");
    render(<RouterProvider router={router} />);

    await screen.findByRole("heading", { name: /^Universities/i });
    expect(searchRequests).toHaveLength(1);

    await act(async () => {
      await router.navigate("/search?q=pravo");
    });

    await waitFor(() => {
      expect(searchRequests).toHaveLength(2);
    });
    expect(searchRequests[1]?.searchParams.get("searchTerm")).toBe("pravo");
  });
});

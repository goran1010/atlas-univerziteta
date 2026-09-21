import { render, screen, act } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import { UnifiedSearch } from "../../../../src/components/Home/UnifiedSearch";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

function Wrapper({ initialEntry = "/search" }: { initialEntry?: string }) {
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

  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  });

  return <RouterProvider router={router} />;
}

const universityListItem = {
  id: 5,
  name: "University of Mostar",
  acronym: "SUM",
  city: "Mostar",
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
  faculty: {
    id: 3,
    name: "Faculty of Electrical Engineering",
    universityId: 1,
    university: {
      id: 1,
      name: "University of Sarajevo",
      acronym: "UNSA",
      city: "Sarajevo",
      entity: "FBIH",
      ownership: "PUBLIC",
    },
  },
};

const trackResult = {
  id: 11,
  name: "Software Engineering Track",
  studyProgramId: 7,
  ects: 60,
  durationYears: 1,
  studyProgram: {
    id: 7,
    name: "Computer Science",
    cycle: "FIRST",
    faculty: {
      id: 3,
      name: "Faculty of Electrical Engineering",
      universityId: 1,
      university: {
        id: 1,
        name: "University of Sarajevo",
        acronym: "UNSA",
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    },
  },
};

function browseResponse(universities: unknown[] = [universityListItem]) {
  return new Response(
    JSON.stringify({
      message: "Universities retrieved successfully.",
      data: universities,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function searchResponse(
  data: Partial<{
    universities: unknown[];
    faculties: unknown[];
    studyPrograms: unknown[];
    tracks: unknown[];
  }> = {},
) {
  return new Response(
    JSON.stringify({
      message: "Search results retrieved successfully.",
      data: {
        universities: [],
        faculties: [],
        studyPrograms: [],
        tracks: [],
        ...data,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("UnifiedSearch", () => {
  vi.spyOn(console, "warn").mockImplementation(() => vi.fn());

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("shows Browse All button on initial visit, clicking it loads universities", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(browseResponse());

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    const browseButton = screen.getByRole("button", { name: /Browse All/i });
    expect(browseButton).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    await user.click(browseButton);

    expect(
      await screen.findByText(/University of Mostar/i),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("explains which terms are searched", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(browseResponse());
    render(<Wrapper />);

    expect(screen.getByText(/Search across all data/i)).toBeInTheDocument();
  });

  test("debounced search triggers after typing and renders results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      searchResponse({
        universities: [universityResult],
        faculties: [facultyResult],
        studyPrograms: [studyProgramResult],
        tracks: [trackResult],
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await screen.findByRole("heading", { name: /^Universities/i });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: /^Faculties/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Study programs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Tracks/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Software Engineering Track/i)).toBeInTheDocument();
  });

  test("does not trigger search for short input (1 char)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(browseResponse());

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(screen.getByRole("searchbox", { name: /Search/i }), "a");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  test("shows the faculty city in faculty results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      searchResponse({ faculties: [facultyResult] }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await screen.findByText(/Faculty of Electrical Engineering/i);
    expect(screen.getByText("Sarajevo")).toBeInTheDocument();
  });

  test("renders combined no results message when nothing matches", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Search results retrieved successfully.",
          data: {
            universities: [],
            faculties: [],
            studyPrograms: [],
            tracks: [],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "no-match-term",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const noResultsMessage = await screen.findByText(/^No results found\.$/i);
    expect(noResultsMessage).toBeInTheDocument();
  });

  test("shows translated error on non-404 non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Search exploded." } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const apiErrorMessage = await screen.findByText(
      /^Search did not complete\. Try again in a moment\.$/i,
    );
    expect(apiErrorMessage).toBeInTheDocument();
  });

  test("shows fallback message on thrown request", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const fallbackMessage = await screen.findByText(
      /^Search did not complete\. Try again in a moment\.$/i,
    );
    expect(fallbackMessage).toBeInTheDocument();
  });

  test("shows error notification when a successful response has an invalid payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Search results retrieved successfully.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Wrapper />);

    screen.getByRole("button", { name: /Browse All/i });

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "mostar",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(
      await screen.findByText(
        /^Search did not complete\. Try again in a moment\.$/i,
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(browseResponse());

    render(<Wrapper />);

    expect(screen.getByRole("searchbox", { name: /Search/i })).toHaveFocus();
  });

  test("does not autofocus the search input without a fine pointer", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue(mediaQueryList(false));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(browseResponse());

    render(<Wrapper />);

    expect(
      screen.getByRole("searchbox", { name: /Search/i }),
    ).not.toHaveFocus();
  });
});

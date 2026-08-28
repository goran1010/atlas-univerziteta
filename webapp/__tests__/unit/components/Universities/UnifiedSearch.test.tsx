import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { UnifiedSearch } from "../../../../src/components/Universities/UnifiedSearch";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

function Wrapper() {
  return (
    <RootContextProvider>
      <MemoryRouter>
        <Notifications />
        <UnifiedSearch />
      </MemoryRouter>
    </RootContextProvider>
  );
}

const universityResult = {
  id: 5,
  name: "University of Mostar",
  acronym: "SUM",
  city: "Mostar",
  entity: "FBIH",
  ownership: "PRIVATNA",
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
  },
};

const studyProgramResult = {
  id: 7,
  name: "Computer Science",
  facultyId: 3,
  cycle: "PRVI",
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
    },
  },
};

const subjectResult = {
  id: 11,
  name: "Computer Networks",
  studyProgramId: 7,
  semester: 4,
  ects: 6,
  type: "OBAVEZNI",
  studyProgram: {
    id: 7,
    name: "Computer Science",
    cycle: "PRVI",
    faculty: {
      id: 3,
      name: "Faculty of Electrical Engineering",
      universityId: 1,
      university: {
        id: 1,
        name: "University of Sarajevo",
        acronym: "UNSA",
        city: "Sarajevo",
      },
    },
  },
};

function searchResponse(
  data: Partial<{
    universities: unknown[];
    faculties: unknown[];
    studyPrograms: unknown[];
    subjects: unknown[];
  }> = {},
) {
  return new Response(
    JSON.stringify({
      message: "Search results retrieved successfully.",
      data: {
        universities: [],
        faculties: [],
        studyPrograms: [],
        subjects: [],
        ...data,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("UnifiedSearch", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      searchResponse({
        universities: [universityResult],
        faculties: [facultyResult],
        studyPrograms: [studyProgramResult],
        subjects: [subjectResult],
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows validation message and skips fetch for short search term", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    const searchInput = screen.getByRole("searchbox", { name: /Search/i });
    const searchButton = screen.getByRole("button", { name: /^Search$/i });

    await user.type(searchInput, "a");
    await user.click(searchButton);

    const validationMessage = await screen.findByText(
      /Search must have at least 2 characters/i,
    );

    expect(fetch).toHaveBeenCalledTimes(0);
    expect(validationMessage).toBeInTheDocument();
  });

  test("shows validation message and skips fetch for an over-limit search term", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    const searchInput = screen.getByRole("searchbox", { name: /Search/i });
    const searchButton = screen.getByRole("button", { name: /^Search$/i });
    fireEvent.change(searchInput, { target: { value: "a".repeat(101) } });
    await user.click(searchButton);

    expect(
      await screen.findByText(/Search must not exceed 100 characters/i),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("explains which terms are searched", () => {
    render(<Wrapper />);

    expect(
      screen.getByText(
        /Search universities, faculties, study programs, and subjects by name/i,
      ),
    ).toBeInTheDocument();
  });

  test("fires a single request and renders all four grouped sections", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    const universityName = await screen.findByText(/University of Mostar/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    const firstCallUrl = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(firstCallUrl).toBeTypeOf("string");
    expect(firstCallUrl).toContain("/api/v1/search?searchTerm=sarajevo");
    expect(
      screen.getByRole("heading", { name: /^Universities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Faculties/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Study programs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Subjects/i }),
    ).toBeInTheDocument();
    expect(universityName).toBeInTheDocument();
    expect(
      screen.getAllByText(/Faculty of Electrical Engineering/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Computer Science/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Computer Networks/i)).toBeInTheDocument();
  });

  test("shows the faculty city in faculty results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      searchResponse({ faculties: [facultyResult] }),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    await screen.findByText(/Faculty of Electrical Engineering/i);

    expect(screen.getByText(/City: Sarajevo/i)).toBeInTheDocument();
  });

  test("renders combined no results message on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Not found" } }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(screen.getByRole("searchbox", { name: /Search/i }), "xy");
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    const noResultsMessage = await screen.findByText(/^No results found\.$/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(noResultsMessage).toBeInTheDocument();
  });

  test("renders per-group empty messages when only some groups match", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      searchResponse({ studyPrograms: [studyProgramResult] }),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "computer",
    );
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    await screen.findByText(/Computer Science/i);

    expect(screen.getByText(/^No universities found\.$/i)).toBeInTheDocument();
    expect(screen.getByText(/^No faculties found\.$/i)).toBeInTheDocument();
    expect(screen.getByText(/^No subjects found\.$/i)).toBeInTheDocument();
  });

  test("shows translated error on non-404 non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Search exploded." } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    const apiErrorMessage = await screen.findByText(/^Search failed\.$/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(apiErrorMessage).toBeInTheDocument();
  });

  test("shows fallback message on thrown request", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "sarajevo",
    );
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    const fallbackMessage = await screen.findByText(/^Search failed\.$/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fallbackMessage).toBeInTheDocument();
  });

  test("shows error notification when a successful response has an invalid payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Search results retrieved successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("searchbox", { name: /Search/i }),
      "mostar",
    );
    await user.click(screen.getByRole("button", { name: /^Search$/i }));

    expect(await screen.findByText(/^Search failed\.$/i)).toBeInTheDocument();
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
    vi.spyOn(window, "matchMedia").mockReturnValueOnce(mediaQueryList(true));

    render(<Wrapper />);

    expect(screen.getByRole("searchbox", { name: /Search/i })).toHaveFocus();
  });

  test("does not autofocus the search input without a fine pointer", () => {
    vi.spyOn(window, "matchMedia").mockReturnValueOnce(mediaQueryList(false));

    render(<Wrapper />);

    expect(
      screen.getByRole("searchbox", { name: /Search/i }),
    ).not.toHaveFocus();
  });
});

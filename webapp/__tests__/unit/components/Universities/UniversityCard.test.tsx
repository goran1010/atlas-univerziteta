import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { UniversityCard } from "../../../../src/components/Universities/UniversityCard";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UniversityListItem } from "../../../../src/schemas/university";

const baseUniversity: UniversityListItem = {
  id: 1,
  name: "University of Sarajevo",
  acronym: "UNSA",
  city: "Sarajevo",
  entity: "FBIH",
  ownership: "PUBLIC",
  foundedYear: "1949",
  website: "https://unsa.ba",
  address: undefined,
  phone: undefined,
  email: undefined,
  accreditationFrom: undefined,
  accreditationTo: undefined,
  authority: undefined,
  sourceUrl: undefined,
  lastModified: undefined,
  _count: { faculties: 3 },
};

function Wrapper({ university = baseUniversity }) {
  return (
    <RootContextProvider>
      <MemoryRouter>
        <Notifications />
        <ul>
          <UniversityCard university={university} />
        </ul>
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("UniversityCard", () => {
  vi.spyOn(console, "warn").mockImplementation(() => vi.fn());

  beforeEach(() => {
    const mockResponse = new Response(
      JSON.stringify({
        message: "University retrieved successfully.",
        data: { ...baseUniversity, faculties: [] },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders basic university metadata", () => {
    render(<Wrapper />);

    const universityName = screen.getByText(/University of Sarajevo/i);
    const cityText = screen.getByText("Sarajevo");
    const entityText = screen.getByText(/Federation of B&H/i);
    const foundedText = screen.getByText("1949");
    const websiteLink = screen.getByRole("link", {
      name: /https:\/\/unsa\.ba/i,
    });

    expect(universityName).toBeInTheDocument();
    expect(cityText).toBeInTheDocument();
    expect(entityText).toBeInTheDocument();
    expect(foundedText).toBeInTheDocument();
    expect(websiteLink).toHaveAttribute("href", "https://unsa.ba");
  });

  test("loads details, can hide details, and reopens cached details without refetch", async () => {
    const mockResponse = new Response(
      JSON.stringify({
        message: "University retrieved successfully.",
        data: { ...baseUniversity, faculties: [] },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    render(<Wrapper />);
    const user = userEvent.setup();

    const viewDetailsButton = screen.getByRole("button", {
      name: /Expand/i,
    });

    await user.click(viewDetailsButton);

    const noFacultiesText = await screen.findByText(/Faculties: -/i);
    expect(noFacultiesText).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);

    const hideDetailsButton = screen.getByRole("button", {
      name: /Collapse/i,
    });
    await user.click(hideDetailsButton);

    expect(screen.queryByText(/Faculties: -/i)).not.toBeInTheDocument();

    const showCachedDetailsButton = screen.getByRole("button", {
      name: /Expand/i,
    });
    await user.click(showCachedDetailsButton);

    const cachedDetails = await screen.findByText(/Faculties: -/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(cachedDetails).toBeInTheDocument();
  });

  test("expands nested faculty, study program and track rows", async () => {
    const mockResponse = new Response(
      JSON.stringify({
        message: "University retrieved successfully.",
        data: {
          ...baseUniversity,
          faculties: [
            {
              id: 11,
              name: "Faculty of Electrical Engineering",
              universityId: 1,
              studyPrograms: [
                {
                  id: 21,
                  name: "Computer Science",
                  facultyId: 11,
                  cycle: "FIRST",
                  ects: 180,
                  tracks: [
                    {
                      id: 31,
                      name: "Software Track",
                      studyProgramId: 21,
                      ects: 60,
                      durationYears: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    render(<Wrapper />);
    const user = userEvent.setup();

    const viewDetailsButton = screen.getByRole("button", {
      name: /Expand/i,
    });
    await user.click(viewDetailsButton);

    const facultiesTitle = await screen.findByText(
      (_content, element) =>
        element?.tagName === "P" &&
        /1\s+faculty/i.test(element.textContent),
    );
    expect(facultiesTitle).toBeInTheDocument();

    // Faculty name is now plain text; its "View details" button is a sibling
    expect(
      screen.getByText(/Faculty of Electrical Engineering/i),
    ).toBeInTheDocument();

    // University button is now "Hide details"; the faculty has the only "View details"
    const facultyViewButton = screen.getByRole("button", {
      name: /Expand/i,
    });
    await user.click(facultyViewButton);

    // Study program details (name, duration, ECTS) are shown immediately
    const programName = await screen.findByText(/Computer Science/i);
    expect(programName).toBeInTheDocument();

    // Study program's "View details" expands its tracks
    const studyProgramViewButton = screen.getByRole("button", {
      name: /Expand/i,
    });
    await user.click(studyProgramViewButton);

    const trackName = await screen.findByText(/Software Track/i);
    const durationText = screen.getByText(/1 year\b/i);
    const ectsText = screen.getByText(/60 ECTS/i);

    expect(trackName).toBeInTheDocument();
    expect(durationText).toBeInTheDocument();
    expect(ectsText).toBeInTheDocument();
  });

  test("shows API error notification when details response is non-ok", async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ error: { message: "Failed from API." } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockErrorResponse);

    render(<Wrapper />);
    const user = userEvent.setup();

    const viewDetailsButton = screen.getByRole("button", {
      name: /Expand/i,
    });
    await user.click(viewDetailsButton);

    const apiErrorMessage = await screen.findByText(
      /Failed to load university details\./i,
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(apiErrorMessage).toBeInTheDocument();
  });

  test("shows an error notification when a successful details response is malformed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "University retrieved successfully.",
          data: { id: 1, name: "University of Sarajevo" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    const errorMessage = await screen.findByText(
      /Failed to load university details\./i,
    );

    expect(errorMessage).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expand/i })).toBeVisible();
  });

  test("rejects an out-of-range academic value in a successful details response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "University retrieved successfully.",
          data: {
            ...baseUniversity,
            faculties: [
              {
                id: 11,
                name: "Faculty of Electrical Engineering",
                universityId: 1,
                studyPrograms: [
                  {
                    id: 21,
                    name: "Computer Science",
                    facultyId: 11,
                    cycle: "FIRST",
                    tracks: [
                      {
                        id: 31,
                        name: "Software Track",
                        studyProgramId: 21,
                        ects: 0,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(
      await screen.findByText(/Failed to load university details\./i),
    ).toBeInTheDocument();
  });

  test("shows fallback notification when details request throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));

    render(<Wrapper />);
    const user = userEvent.setup();

    const viewDetailsButton = screen.getByRole("button", {
      name: /Expand/i,
    });
    await user.click(viewDetailsButton);

    const fallbackError = await screen.findByText(
      /Failed to load university details\./i,
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fallbackError).toBeInTheDocument();
  });

  test("renders private ownership label", () => {
    render(
      <Wrapper
        university={{
          ...baseUniversity,
          id: 2,
          ownership: "PRIVATE",
        }}
      />,
    );

    const privateOwnership = screen.getByText(/Private/i);

    expect(privateOwnership).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { UniversityResult } from "../../../../src/components/Home/UniversityResult";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

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

const nestedFaculties = [
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
];

let detailRequests = 0;

function givenDetails(faculties: unknown) {
  server.use(
    http.get("*/api/v1/universities/:id", () => {
      detailRequests++;
      return HttpResponse.json({
        message: "University retrieved successfully.",
        data: { ...baseUniversity, faculties },
      });
    }),
  );
}

function Wrapper({ university = baseUniversity }) {
  return (
    <RootContextProvider>
      <MemoryRouter>
        <Notifications />
        <ul>
          <UniversityResult university={university} />
        </ul>
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("UniversityResult", () => {
  beforeEach(() => {
    detailRequests = 0;
    givenDetails([]);
  });

  test("renders basic university metadata", () => {
    render(<Wrapper />);

    expect(screen.getByText(/University of Sarajevo/i)).toBeInTheDocument();
    expect(screen.getByText("Sarajevo")).toBeInTheDocument();
    expect(screen.getByText(/Federation of B&H/i)).toBeInTheDocument();
    expect(screen.getByText("1949")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /https:\/\/unsa\.ba/i }),
    ).toHaveAttribute("href", "https://unsa.ba");
  });

  test("loads details, can hide details, and reopens cached details without refetch", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(await screen.findByText(/Faculties: -/i)).toBeInTheDocument();
    expect(detailRequests).toBe(1);

    await user.click(screen.getByRole("button", { name: /Collapse/i }));

    expect(screen.queryByText(/Faculties: -/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(await screen.findByText(/Faculties: -/i)).toBeInTheDocument();
    expect(detailRequests).toBe(1);
  });

  test("expands nested faculty, study program and track rows", async () => {
    givenDetails(nestedFaculties);

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    const facultiesTitle = await screen.findByText(
      (_content, element) =>
        element?.tagName === "P" && /1\s+faculty/i.test(element.textContent),
    );
    expect(facultiesTitle).toBeInTheDocument();

    // Faculty name is now plain text; its "View details" button is a sibling
    expect(
      screen.getByText(/Faculty of Electrical Engineering/i),
    ).toBeInTheDocument();

    // University button is now "Hide details"; the faculty has the only "View details"
    await user.click(screen.getByRole("button", { name: /Expand/i }));

    // Study program details (name, duration, ECTS) are shown immediately
    expect(await screen.findByText(/Computer Science/i)).toBeInTheDocument();

    // tracks render inline with the study program, no further expand
    expect(await screen.findByText(/Software Track/i)).toBeInTheDocument();
    expect(screen.getByText(/1 year\b/i)).toBeInTheDocument();
    expect(screen.getByText(/60 ECTS/i)).toBeInTheDocument();
  });

  test("shows API error notification when details response is non-ok", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.get("*/api/v1/universities/:id", () =>
        HttpResponse.json(
          { error: { message: "Failed from API." } },
          { status: 500 },
        ),
      ),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to load university details:",
      "Failed from API.",
    );
  });

  test("shows an error notification when a successful details response is malformed", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());
    server.use(
      http.get("*/api/v1/universities/:id", () =>
        HttpResponse.json({
          message: "University retrieved successfully.",
          data: { id: 1, name: "University of Sarajevo" },
        }),
      ),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expand/i })).toBeVisible();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error trying to load university details:",
      expect.any(Error),
    );
  });

  test("rejects an out-of-range academic value in a successful details response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    givenDetails([
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
    ]);

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
  });

  test("shows fallback notification when details request throws", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());
    server.use(
      http.get("*/api/v1/universities/:id", () => HttpResponse.error()),
    );

    render(<Wrapper />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error trying to load university details:",
      expect.any(Error),
    );
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

    expect(screen.getByText(/Private/i)).toBeInTheDocument();
  });
});

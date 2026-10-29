import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { FacultyResult } from "../../../../src/components/entityCards/FacultyResult";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { FacultySearchResult } from "../../../../src/schemas/university";

const faculty: FacultySearchResult = {
  id: 11,
  name: "Faculty of Electrical Engineering",
  universityId: 1,
  city: "Sarajevo",
  website: "https://etf.unsa.ba",
  address: "Zmaja od Bosne bb, 71000 Sarajevo",
  phone: "+387 33 250 700",
  email: "info@etf.unsa.ba",
  _count: { studyPrograms: 2 },
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

const facultyDetail = {
  id: 11,
  name: "Faculty of Electrical Engineering",
  universityId: 1,
  city: "Sarajevo",
  university: {
    id: 1,
    name: "University of Sarajevo",
    city: "Sarajevo",
    entity: "FBIH",
    ownership: "PUBLIC",
  },
  studyPrograms: [
    {
      id: 21,
      name: "Computer Science",
      facultyId: 11,
      cycle: "FIRST",
      tracks: [],
    },
    {
      id: 22,
      name: "Data Science",
      facultyId: 11,
      cycle: "SECOND",
      tracks: [],
    },
  ],
};

let detailRequests = 0;

function givenFacultyDetail() {
  server.use(
    http.get("*/api/v1/faculties/:id", () => {
      detailRequests++;
      return HttpResponse.json({
        message: "Faculty retrieved successfully.",
        data: facultyDetail,
      });
    }),
  );
}

function renderResult(
  result: FacultySearchResult = faculty,
  contextHint?: string,
) {
  render(
    <RootContextProvider>
      <MemoryRouter>
        <Notifications />
        <FacultyResult faculty={result} contextHint={contextHint} />
      </MemoryRouter>
    </RootContextProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  detailRequests = 0;
});

describe("FacultyResult", () => {
  test("renders the faculty link, university and context hint", () => {
    renderResult(faculty, "Matched through its study programs");

    expect(
      screen.getByRole("link", { name: /Faculty of Electrical Engineering/i }),
    ).toHaveAttribute("href", "/faculties/11");
    expect(
      screen.getByText(/University of Sarajevo \(UNSA\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Sarajevo")).toBeInTheDocument();
    expect(
      screen.getByText(/Matched through its study programs/i),
    ).toBeInTheDocument();
  });

  test("expands to grouped study programs and reuses the cached details", async () => {
    givenFacultyDetail();
    const user = renderResult();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(await screen.findByText(/Computer Science/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Science/i)).toBeInTheDocument();
    // programs are grouped by cycle
    expect(screen.getByText(/First \(Bachelor\)/i)).toBeInTheDocument();
    expect(detailRequests).toBe(1);

    await user.click(screen.getByRole("button", { name: /Collapse/i }));
    expect(screen.queryByText(/Computer Science/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(await screen.findByText(/Computer Science/i)).toBeInTheDocument();
    expect(detailRequests).toBe(1);
  });

  test("offers no expand toggle for a faculty without programs", () => {
    renderResult({ ...faculty, _count: { studyPrograms: 0 } });

    expect(
      screen.queryByRole("button", { name: /Expand/i }),
    ).not.toBeInTheDocument();
  });

  test("shows an error notification when loading details fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.get("*/api/v1/faculties/:id", () =>
        HttpResponse.json(
          { error: { message: "Failed from API." } },
          { status: 500 },
        ),
      ),
    );
    const user = renderResult();

    await user.click(screen.getByRole("button", { name: /Expand/i }));

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
  });

  test("opens the info dialog with a link to the full page", async () => {
    const user = renderResult();

    await user.click(screen.getByRole("button", { name: /View info/i }));

    expect(
      await screen.findByRole("link", { name: /Open full page/i }),
    ).toHaveAttribute("href", "/faculties/11");
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { FacultyRow } from "../../../../src/components/entityCards/FacultyRow";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { UniversityDetailFaculty } from "../../../../src/schemas/university";

const faculty: UniversityDetailFaculty = {
  id: 11,
  name: "Faculty of Electrical Engineering",
  universityId: 1,
  city: "Sarajevo",
  website: undefined,
  address: undefined,
  phone: undefined,
  email: undefined,
  dataSourceUrl: undefined,
  lastModified: undefined,
  studyPrograms: [
    {
      id: 21,
      name: "Computer Science",
      facultyId: 11,
      cycle: "FIRST",
      durationYears: undefined,
      ects: undefined,
      languages: [],
      dataSourceUrl: undefined,
      lastModified: undefined,
      tracks: [],
    },
  ],
};

const identityTranslate = (key: string) => key;

function renderRow(data: UniversityDetailFaculty = faculty) {
  render(
    <RootContextProvider>
      <MemoryRouter>
        <ul>
          <FacultyRow faculty={data} t={identityTranslate} />
        </ul>
      </MemoryRouter>
    </RootContextProvider>,
  );
  return userEvent.setup();
}

describe("FacultyRow", () => {
  test("renders the faculty name and program count", () => {
    renderRow();

    expect(
      screen.getByText("Faculty of Electrical Engineering"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /Faculty of Electrical Engineering/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("expands and collapses the study programs", async () => {
    const user = renderRow();

    expect(screen.queryByText(/Computer Science/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(await screen.findByText(/Computer Science/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Collapse/i }));
    expect(screen.queryByText(/Computer Science/i)).not.toBeInTheDocument();
  });

  test("lists a program's languages, unknown codes as they are", async () => {
    const program = faculty.studyPrograms[0];
    if (!program) throw new Error("fixture has a study program");
    const user = renderRow({
      ...faculty,
      studyPrograms: [{ ...program, languages: ["bs", "xx"] }],
    });

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(
      await screen.findByText("programLanguages.bs, xx"),
    ).toBeInTheDocument();
  });

  test("offers no expand toggle without study programs", () => {
    renderRow({ ...faculty, studyPrograms: [] });

    expect(
      screen.queryByRole("button", { name: /Expand/i }),
    ).not.toBeInTheDocument();
  });

  test("opens the info dialog with a link to the full faculty page", async () => {
    server.use(
      http.get("*/api/v1/faculties/:id", () =>
        HttpResponse.json({
          message: "Faculty retrieved successfully.",
          data: {
            ...faculty,
            university: {
              id: 1,
              name: "University of Sarajevo",
              city: "Sarajevo",
              country: "BIH",
              ownership: "PUBLIC",
            },
          },
        }),
      ),
    );
    const user = renderRow();

    await user.click(
      screen.getByRole("button", { name: /universitiesPage.viewInfo/i }),
    );

    expect(
      await screen.findByRole("link", { name: /Open full page/i }),
    ).toHaveAttribute("href", "/faculties/11");
  });
});

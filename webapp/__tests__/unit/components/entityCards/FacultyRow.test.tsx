import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { FacultyRow } from "../../../../src/components/entityCards/FacultyRow";
import { RootContextProvider } from "../../../utils/rootContextProvider";

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
      language: undefined,
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
  test("renders the faculty link and program count", () => {
    renderRow();

    expect(
      screen.getByRole("link", { name: /Faculty of Electrical Engineering/i }),
    ).toHaveAttribute("href", "/faculties/11");
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

  test("offers no expand toggle without study programs", () => {
    renderRow({ ...faculty, studyPrograms: [] });

    expect(
      screen.queryByRole("button", { name: /Expand/i }),
    ).not.toBeInTheDocument();
  });

  test("opens the info dialog with a link to the full faculty page", async () => {
    const user = renderRow();

    await user.click(
      screen.getByRole("button", { name: /universitiesPage.viewInfo/i }),
    );

    expect(
      await screen.findByRole("link", {
        name: /universitiesPage.openFullPage/i,
      }),
    ).toHaveAttribute("href", "/faculties/11");
  });
});

import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import userEvent from "@testing-library/user-event";
import { FacultyDetailPage } from "../../../../src/components/Home/FacultyDetailPage";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

const facultyDetail = {
  id: 11,
  name: "Faculty of Electrical Engineering",
  universityId: 1,
  city: "Sarajevo",
  website: "https://etf.unsa.ba",
  university: {
    id: 1,
    name: "University of Sarajevo",
    acronym: "UNSA",
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
      ects: 180,
      tracks: [
        {
          id: 31,
          name: "Software Track",
          studyProgramId: 21,
          ects: 60,
        },
      ],
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

function givenFaculty(data: unknown) {
  server.use(
    http.get("*/api/v1/faculties/:id", () =>
      HttpResponse.json({
        message: "Faculty retrieved successfully.",
        data,
      }),
    ),
  );
}

function renderPage(route = "/faculties/11") {
  const router = createMemoryRouter(
    [
      { path: "/faculties/:id", element: <FacultyDetailPage /> },
      { path: "/search", element: <div>Search page</div> },
    ],
    { initialEntries: [route] },
  );
  render(
    <HelmetProvider>
      <RootContextProvider>
        <Notifications />
        <RouterProvider router={router} />
      </RootContextProvider>
    </HelmetProvider>,
  );
  return userEvent.setup();
}

describe("FacultyDetailPage", () => {
  test("renders the faculty with breadcrumb, university link and programs", async () => {
    givenFaculty(facultyDetail);
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: /Faculty of Electrical Engineering/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    const breadcrumb = screen.getByRole("navigation", { name: /Breadcrumb/i });
    expect(breadcrumb).toHaveTextContent("University of Sarajevo");
    expect(
      screen.getByRole("link", { name: /University of Sarajevo \(UNSA\)/i }),
    ).toHaveAttribute("href", "/universities/1");

    expect(
      screen.getByRole("heading", { level: 2, name: /2.*study programs/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Science/i)).toBeInTheDocument();
    expect(screen.getByText(/Software Track/i)).toBeInTheDocument();
    // programs are grouped by cycle
    expect(screen.getByText(/First \(Bachelor\)/i)).toBeInTheDocument();
  });

  test("focuses one program from the query param and can show all again", async () => {
    givenFaculty(facultyDetail);
    const user = renderPage("/faculties/11?program=21");

    expect(await screen.findByText(/Computer Science/i)).toBeInTheDocument();
    expect(screen.queryByText(/Data Science/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /1.*study program/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Show all study programs \(2\)/i }),
    );

    expect(await screen.findByText(/Data Science/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Show all study programs/i }),
    ).not.toBeInTheDocument();
  });

  test("shows the not-found message with a search link on 404", async () => {
    server.use(
      http.get("*/api/v1/faculties/:id", () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Faculty not found." } },
          { status: 404 },
        ),
      ),
    );
    renderPage("/faculties/999");

    expect(
      await screen.findByText(/No faculties found\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Search/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  test("shows an error notification when the request fails", async () => {
    server.use(
      http.get("*/api/v1/faculties/:id", () =>
        HttpResponse.json(
          { error: { message: "Server exploded." } },
          { status: 500 },
        ),
      ),
    );
    renderPage();

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
  });
});

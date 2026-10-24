import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { UniversityDetailPage } from "../../../../src/components/entityDetails/UniversityDetailPage";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

const universityDetail = {
  id: 1,
  name: "University of Sarajevo",
  acronym: "UNSA",
  city: "Sarajevo",
  entity: "FBIH",
  ownership: "PUBLIC",
  foundedYear: "1949",
  website: "https://unsa.ba",
  faculties: [
    {
      id: 11,
      name: "Faculty of Electrical Engineering",
      universityId: 1,
      city: "Sarajevo",
      website: "https://etf.unsa.ba",
      studyPrograms: [
        {
          id: 21,
          name: "Computer Science",
          facultyId: 11,
          cycle: "FIRST",
          tracks: [],
        },
      ],
    },
    {
      id: 12,
      name: "Faculty of Law",
      universityId: 1,
      studyPrograms: [],
    },
  ],
};

function givenUniversity(data: unknown) {
  server.use(
    http.get("*/api/v1/universities/:id", () =>
      HttpResponse.json({
        message: "University retrieved successfully.",
        data,
      }),
    ),
  );
}

function renderPage(route = "/universities/1") {
  const router = createMemoryRouter(
    [
      { path: "/universities/:id", element: <UniversityDetailPage /> },
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
}

describe("UniversityDetailPage", () => {
  test("shows a spinner while the university loads", () => {
    givenUniversity(universityDetail);
    renderPage();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("renders the university with breadcrumb and faculty list", async () => {
    givenUniversity(universityDetail);
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: /University of Sarajevo.*\(UNSA\)/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    const breadcrumb = screen.getByRole("navigation", { name: /Breadcrumb/i });
    expect(breadcrumb).toHaveTextContent("Search");
    expect(breadcrumb).toHaveTextContent("University of Sarajevo");

    // city renders on the university and on its Sarajevo faculty row
    expect(screen.getAllByText("Sarajevo")).toHaveLength(2);
    expect(screen.getByText(/Federation of B&H/i)).toBeInTheDocument();
    expect(screen.getByText("1949")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: /2.*faculties/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Faculty of Electrical Engineering/i }),
    ).toHaveAttribute("href", "/faculties/11");
    expect(
      screen.getByRole("link", { name: /Faculty of Law/i }),
    ).toHaveAttribute("href", "/faculties/12");
    expect(screen.getByText(/1 study program/i)).toBeInTheDocument();
  });

  test("shows the not-found message with a search link on 404", async () => {
    server.use(
      http.get("*/api/v1/universities/:id", () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "University not found." } },
          { status: 404 },
        ),
      ),
    );
    renderPage("/universities/999");

    expect(
      await screen.findByText(/No universities found\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Search/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  test("shows an error notification when the request fails", async () => {
    server.use(
      http.get("*/api/v1/universities/:id", () =>
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

  test("shows an error notification when a successful response is malformed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    givenUniversity({ id: 1, name: "University of Sarajevo" });
    renderPage();

    expect(
      await screen.findByText(
        /Could not load the details\. Try again in a moment\./i,
      ),
    ).toBeInTheDocument();
  });
});

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { UniversityDetailPage } from "../../../../src/components/entityDetails/UniversityDetailPage";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";
import { InvalidResponseError } from "../../../../src/utils/parseResponse";

const universityDetail = {
  id: 1,
  name: "University of Sarajevo",
  acronym: "UNSA",
  city: "Sarajevo",
  country: "BIH",
  entity: "FBIH",
  ownership: "PUBLIC",
  foundedYear: "1949",
  website: "https://unsa.ba",
  dataSourceUrl: "https://www.unsa.ba/o-univerzitetu",
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
      { path: "/", element: <div>Home page</div> },
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

  test("offers a way to suggest a correction", async () => {
    givenUniversity(universityDetail);
    renderPage();

    expect(
      await screen.findByRole("link", {
        name: /Log in to suggest a correction/i,
      }),
    ).toHaveAttribute("href", "/login");
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
    expect(breadcrumb).toHaveTextContent("Home");
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

  test("links the data source", async () => {
    givenUniversity(universityDetail);
    renderPage();

    const link = await screen.findByRole("link", { name: /Data source/i });
    expect(link).toHaveAttribute("href", "https://www.unsa.ba/o-univerzitetu");
  });

  test("shows the not-found message with a home link on 404", async () => {
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
    expect(
      screen.getByRole("link", { name: /Go to Home Page/i }),
    ).toHaveAttribute("href", "/");
  });

  test("shows the error card with a working retry when the request fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      return;
    });
    let failures = 0;
    server.use(
      http.get("*/api/v1/universities/:id", () => {
        failures++;
        if (failures === 1) {
          return HttpResponse.json(
            { error: { message: "Server exploded." } },
            { status: 500 },
          );
        }
        return HttpResponse.json({ message: "ok", data: universityDetail });
      }),
    );
    renderPage();

    expect(
      await screen.findByText("Could not load the data."),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Try again/i }));

    expect(
      await screen.findByRole("heading", { name: /University of Sarajevo/i }),
    ).toBeInTheDocument();
  });

  test("says the data could not be read, without a retry, when a successful response is malformed", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });
    givenUniversity({ id: 1, name: "University of Sarajevo" });
    renderPage();

    expect(
      await screen.findByText("The server sent data the site could not read."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Try again/i }),
    ).not.toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error trying to load university details:",
      expect.any(InvalidResponseError),
    );
  });

  test("says there are no faculties when the university has none", async () => {
    givenUniversity({ ...universityDetail, faculties: [] });
    renderPage();

    expect(
      await screen.findByText("No faculties available."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No study programs available."),
    ).not.toBeInTheDocument();
  });
});

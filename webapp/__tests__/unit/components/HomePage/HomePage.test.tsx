import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { HomePage } from "../../../../src/components/HomePage/HomePage";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

function Wrapper() {
  const routes = [
    {
      path: "/",
      element: (
        <RootContextProvider>
          <HomePage />
        </RootContextProvider>
      ),
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ["/"] });

  return <RouterProvider router={router} />;
}

let searchRequests = 0;

beforeEach(() => {
  searchRequests = 0;
  server.use(
    http.get("*/api/v1/search", () => {
      searchRequests++;
      return HttpResponse.json({
        message: "Search results retrieved successfully.",
        data: {
          universities: [],
          faculties: [],
          studyPrograms: [],
          direct: { universities: 0, faculties: 0, studyPrograms: 0 },
        },
      });
    }),
  );
});

describe("Home page", () => {
  test("renders the page title and search input", async () => {
    render(<Wrapper />);

    expect(
      await screen.findByRole("heading", {
        name: /Find programs and universities/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: /Search/i }),
    ).toBeInTheDocument();
  });

  test("shows Browse All button on initial visit", () => {
    render(<Wrapper />);

    expect(
      screen.getByRole("button", { name: /Browse All/i }),
    ).toBeInTheDocument();
    expect(searchRequests).toBe(0);
  });
});

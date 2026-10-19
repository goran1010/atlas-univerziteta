import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { HomeLayout } from "../../../../src/components/Home/HomeLayout";
import { UnifiedSearch } from "../../../../src/components/Home/UnifiedSearch";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";
import { Navigate } from "react-router";

function Wrapper({ initialEntry = "/search" }: { initialEntry?: string }) {
  const routes = [
    {
      path: "/",
      element: (
        <RootContextProvider>
          <HomeLayout />
        </RootContextProvider>
      ),
      children: [
        { index: true, element: <Navigate to="search" replace /> },
        { path: "search", element: <UnifiedSearch /> },
      ],
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  });

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
          totals: { universities: 0, faculties: 0, studyPrograms: 0 },
          direct: { universities: 0, faculties: 0, studyPrograms: 0 },
        },
      });
    }),
  );
});

describe("Universities page", () => {
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

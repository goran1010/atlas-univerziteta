import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { HomeLayout } from "../../../../src/components/Home/HomeLayout";
import { UnifiedSearch } from "../../../../src/components/Home/UnifiedSearch";
import { RootContextProvider } from "../../../utils/rootContextProvider";
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

beforeEach(() => {
  const mockResponse = new Response(
    JSON.stringify({
      data: [],
      message: "Universities retrieved successfully.",
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

  test("loads universities on initial visit", async () => {
    render(<Wrapper />);

    await screen.findByText(/No universities found\./i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

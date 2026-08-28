import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import { Universities } from "../../../../src/components/Universities/Universities";
import { UnifiedSearch } from "../../../../src/components/Universities/UnifiedSearch";
import { GetAllUniversities } from "../../../../src/components/Universities/GetAllUniversities";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { Navigate } from "react-router";

const user = userEvent.setup();

function Wrapper({ initialEntry = "/search" }: { initialEntry?: string }) {
  const tabRoutes = [
    {
      path: "/",
      element: (
        <RootContextProvider>
          <Universities />
        </RootContextProvider>
      ),
      children: [
        { index: true, element: <Navigate to="search" replace /> },
        { path: "search", element: <UnifiedSearch /> },
        { path: "browse", element: <GetAllUniversities /> },
      ],
    },
  ];

  const router = createMemoryRouter(tabRoutes, {
    initialEntries: [initialEntry],
  });

  return <RouterProvider router={router} />;
}

beforeEach(() => {
  const mockResponse = new Response(JSON.stringify({ data: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Universities page tabs", () => {
  test("renders all tab links", async () => {
    render(<Wrapper />);

    expect(
      await screen.findByRole("link", { name: /Browse All/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Search$/i })).toBeInTheDocument();
  });

  test("switches tabs and renders tab content", async () => {
    render(<Wrapper />);

    const searchInput = screen.getByRole("searchbox", { name: /Search/i });
    expect(searchInput).toBeInTheDocument();

    const browseAllTab = screen.getByRole("link", { name: /Browse All/i });
    await user.click(browseAllTab);

    const emptyMessage = await screen.findByText(/No universities found\./i);
    expect(emptyMessage).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

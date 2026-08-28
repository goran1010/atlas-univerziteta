import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../../src/routes";

const mockValue = new Response(JSON.stringify({ universities: [] }), {
  status: 200,
  headers: { "Content-type": "application/json" },
});

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(mockValue);
});
afterEach(() => {
  vi.restoreAllMocks();
});

function Wrapper() {
  const router = createMemoryRouter(routes, {
    initialEntries: ["/search"],
  });
  render(<RouterProvider router={router} />);
}

describe("Universities page", () => {
  test("renders tab links: Search, Browse All", async () => {
    Wrapper();

    const BrowseAllLink = await screen.findByRole("link", {
      name: /Browse All/i,
    });
    const SearchLink = screen.getByRole("link", { name: /^Search$/i });

    expect(BrowseAllLink).toBeInTheDocument();
    expect(SearchLink).toBeInTheDocument();
  });
});

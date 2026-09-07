import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { routes } from "../../../src/routes";
import { RouterProvider } from "react-router";

const user = userEvent.setup();

vi.spyOn(console, "warn").mockImplementation(() => vi.fn());

function renderErrorPage() {
  const router = createMemoryRouter(routes, {
    initialEntries: ["/non-existent-route"],
  });

  render(<RouterProvider router={router} />);
}

async function getGoHomeLink() {
  return screen.findByRole("link", {
    name: /Go to Home Page/i,
  });
}

describe("ErrorPage component", () => {
  test("renders error message", async () => {
    renderErrorPage();
    const errorMessage = await screen.findByText(/There is nothing here./i);
    expect(errorMessage).toBeInTheDocument();
  });

  test("renders Go Home link with correct href", async () => {
    renderErrorPage();

    const goHomeLink = await getGoHomeLink();

    expect(goHomeLink).toBeInTheDocument();
    expect(goHomeLink).toHaveAttribute("href", "/");
  });
});

describe("ErrorPage navigation", () => {
  test("navigates to home page when Go Home link is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    renderErrorPage();

    const goHomeLink = await getGoHomeLink();
    await user.click(goHomeLink);

    const homePageHeading = await screen.findByRole("heading", {
      name: /Find programs and universities/i,
    });
    expect(homePageHeading).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

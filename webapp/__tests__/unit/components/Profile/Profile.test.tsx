import { render, screen } from "@testing-library/react";
import { Notifications } from "../../../../src/components/Notifications";
import { MemoryRouter, Routes, Route } from "react-router";
import { Profile } from "../../../../src/components/Profile/Profile";
import { LogIn } from "../../../../src/components/LogIn/LogIn";
import userEvent from "@testing-library/user-event";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import { CsrfTokenError } from "../../../../src/utils/getCsrfToken";

import type { UserData } from "../../../../src/types/auth";

let getCsrfTokenMock: () => Promise<string> = () =>
  Promise.resolve("mocked-csrf-token");

vi.mock("../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../src/utils/getCsrfToken")>();
  return {
    ...actual,
    getCsrfToken: () => getCsrfTokenMock(),
    clearCsrfToken: vi.fn(),
  };
});

const user = userEvent.setup();

beforeEach(() => {
  getCsrfTokenMock = () => Promise.resolve("mocked-csrf-token");
  const mockResponse = new Response(
    JSON.stringify({
      message: "User logged out successfully",
      data: null,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
  const mockConsoleError = vi.fn();

  vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);
  vi.spyOn(console, "error").mockImplementation(mockConsoleError);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Wrapper({ initialUser = null }: { initialUser?: UserData }) {
  return (
    <RootContextProvider initialUserData={initialUser}>
      <MemoryRouter initialEntries={["/profile"]}>
        <Notifications />
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </RootContextProvider>
  );
}

async function clickLogout() {
  const logoutButton = await screen.findByRole("button", {
    name: /Log out/i,
  });

  expect(logoutButton).toBeInTheDocument();
  await user.click(logoutButton);

  return logoutButton;
}

describe("Profile Component", () => {
  test("renders profile component when user is not logged in", async () => {
    render(<Wrapper />);
    const paragraphElement = await screen.findByText(
      /You need to be logged in. Redirected to the login page./i,
    );
    expect(paragraphElement).toBeInTheDocument();
  });

  test("renders profile component when user is logged in", async () => {
    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );
    const headingElement = await screen.findByRole("heading", {
      name: /My Profile/i,
    });
    expect(headingElement).toBeInTheDocument();
  });

  test("displays user information correctly", async () => {
    const user: UserData = {
      email: "testuser@example.com",
      role: "USER",
    };
    render(<Wrapper initialUser={user} />);
    const emailElement = await screen.findByText(/testuser@example.com/i);
    const roleElement = await screen.findByText("USER");
    expect(emailElement).toBeInTheDocument();
    expect(roleElement).toBeInTheDocument();
  });

  test("displays admin role when user role is ADMIN", async () => {
    const user: UserData = {
      email: "admin@example.com",
      role: "ADMIN",
    };
    render(<Wrapper initialUser={user} />);
    const emailElement = await screen.findByText(/admin@example.com/i);
    const roleElement = await screen.findByText("ADMIN");
    expect(emailElement).toBeInTheDocument();
    expect(roleElement).toBeInTheDocument();
  });
});

describe("Profile Component handle logout", () => {
  test("stays on the profile when fetching the csrf token fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    getCsrfTokenMock = () =>
      Promise.reject(new CsrfTokenError(new Error("token endpoint down")));

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    await clickLogout();

    const headingElement = await screen.findByRole("heading", {
      name: /My Profile/i,
    });
    expect(headingElement).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("handles logout failure due to server error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mockErrorResponse = new Response(
      JSON.stringify({
        error: { message: "An error occurred while logging out." },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
    fetchSpy.mockResolvedValueOnce(mockErrorResponse);

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    await clickLogout();

    const notificationElement = await screen.findByText("Logout failed.");
    expect(notificationElement).toBeInTheDocument();
  });

  test("handles logout failure due to unexpected error", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());

    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    await clickLogout();

    const notificationElement = await screen.findByText(
      /An error occurred while logging out./i,
    );
    expect(notificationElement).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("handles logout correctly", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mockSuccessResponse = new Response(
      JSON.stringify({
        message: "User logged out successfully",
        data: null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    fetchSpy.mockResolvedValueOnce(mockSuccessResponse);

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );
    const logoutButton = await clickLogout();

    const notificationElement = await screen.findByText(
      /Successfully logged out/i,
    );
    expect(notificationElement).toBeInTheDocument();

    const logIn = await screen.findByRole("heading", { name: /Log In/i });

    expect(logIn).toBeInTheDocument();
    expect(logoutButton).not.toBeInTheDocument();
  });

  test("keeps the user logged in when a successful logout response is malformed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    await clickLogout();

    expect(
      await screen.findByText(/^An error occurred while logging out\.$/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /My Profile/i }),
    ).toBeInTheDocument();
  });
});

describe("Profile Component admin request", () => {
  test("shows the request button for a USER without an active request", async () => {
    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    expect(
      await screen.findByRole("button", { name: /Request admin access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Admin request pending/i),
    ).not.toBeInTheDocument();
  });

  test("requests admin access and shows the pending state", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Admin access requested. An admin will review it.",
          data: { adminRequestedAt: "2026-08-16T10:00:00.000Z" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    await user.click(
      await screen.findByRole("button", { name: /Request admin access/i }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/users/request-admin"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "mocked-csrf-token",
        },
      }),
    );
    expect(
      await screen.findByText(/Admin request pending/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancel admin request/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Request admin access/i }),
    ).not.toBeInTheDocument();
  });

  test("cancels a pending admin request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "Admin request cancelled.", data: null }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <Wrapper
        initialUser={{
          email: "testuser@example.com",
          role: "USER",
          adminRequestedAt: "2026-08-16T10:00:00.000Z",
        }}
      />,
    );

    expect(
      await screen.findByText(/Admin request pending/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Cancel admin request/i }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/users/request-admin"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(
      await screen.findByRole("button", { name: /Request admin access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Admin request pending/i),
    ).not.toBeInTheDocument();
  });

  test("shows an error notification when the request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: "Something went wrong." } }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());

    render(
      <Wrapper initialUser={{ email: "testuser@example.com", role: "USER" }} />,
    );

    await user.click(
      await screen.findByRole("button", { name: /Request admin access/i }),
    );

    expect(
      await screen.findByText(/Error requesting admin access./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request admin access/i }),
    ).toBeInTheDocument();
  });

  test("does not show admin request controls for an ADMIN", async () => {
    render(
      <Wrapper initialUser={{ email: "admin@example.com", role: "ADMIN" }} />,
    );

    await screen.findByRole("heading", { name: /My Profile/i });

    expect(
      screen.queryByRole("button", { name: /Request admin access/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Admin request pending/i),
    ).not.toBeInTheDocument();
  });
});

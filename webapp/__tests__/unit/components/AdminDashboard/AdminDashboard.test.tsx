import { render, screen } from "@testing-library/react";
import { AdminDashboard } from "../../../../src/components/AdminDashboard/AdminDashboard";
import { Notifications } from "../../../../src/components/Notifications";
import { MemoryRouter, Routes, Route } from "react-router";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UserData } from "../../../../src/types/auth";

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [],
        message: "mocked message",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Wrapper({ initialUser = null }: { initialUser?: UserData }) {
  return (
    <RootContextProvider
      initialUserData={initialUser}
      rootValue={{ addNotification: vi.fn() }}
    >
      <MemoryRouter initialEntries={["/admin-dashboard"]}>
        <Notifications />
        <Routes>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("AdminDashboard component", () => {
  test("render component if user doesn't exist", async () => {
    render(<Wrapper initialUser={null} />);
    const paragraphElement = await screen.findByText(
      /You need to be logged in and an admin to see the admin dashboard./i,
    );
    expect(paragraphElement).toBeInTheDocument();
  });

  test("render component if user is not admin", async () => {
    render(<Wrapper initialUser={{ email: "user@mail.com", role: "USER" }} />);

    const paragraphElement = await screen.findByText(
      /You need to be an admin to see the admin dashboard./i,
    );
    expect(paragraphElement).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Admin Dashboard" }),
    ).not.toBeInTheDocument();
  });

  test("render component if user is admin", async () => {
    render(
      <Wrapper initialUser={{ email: "admin@mail.com", role: "ADMIN" }} />,
    );

    const headingElement = await screen.findByRole("heading", {
      name: /Admin Dashboard/i,
    });

    expect(headingElement).toBeInTheDocument();
  });
});

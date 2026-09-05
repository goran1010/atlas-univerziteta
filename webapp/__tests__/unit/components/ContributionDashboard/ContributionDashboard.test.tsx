import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ContributionDashboard } from "../../../../src/components/ContributionDashboard/ContributionDashboard";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { UserData } from "../../../../src/types/auth";

function Wrapper({ initialUser }: { initialUser: UserData }) {
  return (
    <RootContextProvider initialUserData={initialUser}>
      <MemoryRouter initialEntries={["/improve-data"]}>
        <Notifications />
        <Routes>
          <Route path="/improve-data" element={<ContributionDashboard />} />
        </Routes>
      </MemoryRouter>
    </RootContextProvider>
  );
}

describe("render ContributionDashboard component", () => {
  vi.spyOn(console, "warn").mockImplementation(() => vi.fn());

  test("render message if user doesn't exist", async () => {
    render(<Wrapper initialUser={null} />);

    const paragraphElement = await screen.findByText(
      /You need to be a registered user to propose changes to the content./i,
    );
    expect(paragraphElement).toBeInTheDocument();
  });

  test("renders contribution form when user exists", async () => {
    const userData: UserData = {
      email: "some@email.com",
      role: "USER",
    };
    render(<Wrapper initialUser={userData} />);

    const headingElement = await screen.findByRole("heading", {
      name: /Improve the Data/i,
    });

    expect(headingElement).toBeInTheDocument();
  });
});

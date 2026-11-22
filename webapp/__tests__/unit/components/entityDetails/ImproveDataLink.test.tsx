import { screen } from "@testing-library/react";
import { ImproveDataLink } from "../../../../src/components/entityDetails/ImproveDataLink";
import { renderWithProviders } from "../../../utils/renderWithProviders";
import { makeUser } from "../../../utils/makeUser";

describe("ImproveDataLink", () => {
  test("sends a logged-out visitor to log in first", () => {
    renderWithProviders(<ImproveDataLink />);

    expect(screen.getByText(/See something inaccurate\?/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Log in to suggest a correction/i }),
    ).toHaveAttribute("href", "/login");
  });

  test("links a logged-in user to the contribution form", () => {
    renderWithProviders(<ImproveDataLink />, { userData: makeUser() });

    expect(
      screen.getByRole("link", { name: /Suggest a correction/i }),
    ).toHaveAttribute("href", "/improve-data/add");
  });
});

import { screen } from "@testing-library/react";
import { Footer } from "../../../../src/components/layout/Footer";
import { renderWithProviders } from "../../../utils/renderWithProviders";

const ISSUE_CHOOSER =
  "https://github.com/goran1010/atlas-univerziteta/issues/new/choose";

describe("Footer", () => {
  test("links to GitHub's new-issue page in a new tab", () => {
    renderWithProviders(<Footer />);

    const link = screen.getByRole("link", { name: /Report an issue/i });

    expect(link).toHaveAttribute("href", ISSUE_CHOOSER);
    expect(link).toHaveAttribute("target", "_blank");
  });

  test("labels the link in Serbian", () => {
    localStorage.setItem("language", "sr");

    renderWithProviders(<Footer />);

    expect(
      screen.getByRole("link", { name: /Prijavi problem/i }),
    ).toHaveAttribute("href", ISSUE_CHOOSER);
  });
});

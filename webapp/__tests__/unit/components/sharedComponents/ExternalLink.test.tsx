import { screen } from "@testing-library/react";
import { ExternalLink } from "../../../../src/components/sharedComponents/ExternalLink";
import { renderWithProviders } from "../../../utils/renderWithProviders";

describe("ExternalLink", () => {
  test("renders a link for http(s), mailto and tel hrefs", () => {
    renderWithProviders(
      <>
        <ExternalLink href="https://example.ba">Website</ExternalLink>
        <ExternalLink href="mailto:info@example.ba">Email</ExternalLink>
        <ExternalLink href="tel:+38733123456">Phone</ExternalLink>
      </>,
    );

    expect(screen.getByRole("link", { name: /Website/ })).toHaveAttribute(
      "href",
      "https://example.ba",
    );
    expect(screen.getByRole("link", { name: /Email/ })).toHaveAttribute(
      "href",
      "mailto:info@example.ba",
    );
    expect(screen.getByRole("link", { name: /Phone/ })).toHaveAttribute(
      "href",
      "tel:+38733123456",
    );
  });

  test("renders plain text instead of a link for unsafe hrefs", () => {
    renderWithProviders(
      // eslint-disable-next-line react-dom/no-script-url -- the unsafe href is the test subject
      <ExternalLink href="javascript:alert(1)">Malicious</ExternalLink>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Malicious")).toBeInTheDocument();
  });
});

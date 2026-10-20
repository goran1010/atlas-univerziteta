import { screen } from "@testing-library/react";
import { ParentBreadcrumb } from "../../../../src/components/sharedComponents/ParentBreadcrumb";
import { renderWithProviders } from "../../../utils/renderWithProviders";

import type { ParentCrumb } from "../../../../src/schemas/pendingChange";

const crumbs: ParentCrumb[] = [
  { entityType: "UNIVERSITY", id: 3, name: "Test University" },
  { entityType: "FACULTY", id: 7, name: "Test Faculty" },
  { entityType: "STUDY_PROGRAM", id: 11, name: "Test Program" },
];

describe("ParentBreadcrumb", () => {
  test("links university and faculty crumbs to their detail pages", () => {
    renderWithProviders(<ParentBreadcrumb crumbs={crumbs} />);

    expect(
      screen.getByRole("link", { name: "Test University" }),
    ).toHaveAttribute("href", "/universities/3");
    expect(screen.getByRole("link", { name: "Test Faculty" })).toHaveAttribute(
      "href",
      "/faculties/7",
    );
  });

  test("renders a study program crumb as plain text without a link", () => {
    renderWithProviders(<ParentBreadcrumb crumbs={crumbs} />);

    expect(screen.getByText(/Test Program/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Test Program/ }),
    ).not.toBeInTheDocument();
  });

  test("shows the changed entity as the final, non-linked segment", () => {
    renderWithProviders(
      <ParentBreadcrumb crumbs={crumbs.slice(0, 1)} current="Changed Entity" />,
    );

    expect(screen.getByText(/Changed Entity/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Changed Entity/ }),
    ).not.toBeInTheDocument();
  });

  test("renders only the entity name when there are no parents", () => {
    renderWithProviders(
      <ParentBreadcrumb crumbs={[]} current="Top Level University" />,
    );

    expect(screen.getByText("Top Level University")).toBeInTheDocument();
  });

  test("renders nothing without crumbs or a current entity", () => {
    const { container } = renderWithProviders(<ParentBreadcrumb crumbs={[]} />);

    expect(container.querySelector("p")).toBeNull();
  });
});

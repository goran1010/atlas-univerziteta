import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PendingUniversityChangesRow } from "../../../../src/components/ContributionDashboard/PendingUniversityChangesRow";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { ReactElement } from "react";
import type { PendingChange } from "../../../../src/schemas/pendingChange";

const change: PendingChange = {
  id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
  entityType: "UNIVERSITY",
  typeOfChange: "DELETE",
  targetId: 1,
  parentId: null,
  data: {},
  userId: "",
  user: {
    email: "",
    role: "ADMIN",
  },
  createdAt: new Date(),
};

function Wrapper({ children }: { children: ReactElement }) {
  return <RootContextProvider>{children}</RootContextProvider>;
}

beforeEach(() => {
  localStorage.setItem("language", "en");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PendingUniversityChangesRow", () => {
  test("renders the pending change and its delete badge", () => {
    render(
      <Wrapper>
        <PendingUniversityChangesRow
          change={change}
          index={0}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    const badges = screen.getAllByText("Delete");
    const badge = badges.find((el) => el.tagName === "SPAN");

    expect(screen.getByText(/University/i)).toBeInTheDocument();
    expect(badge).toHaveClass("bg-red-100");
    expect(
      screen.getByRole("button", { name: /View details/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
  });

  test("shows the contribution name in the expanded detail", async () => {
    render(
      <Wrapper>
        <PendingUniversityChangesRow
          change={{
            ...change,
            entityType: "UNIVERSITY",
            typeOfChange: "CREATE",
            targetId: null,
            data: {
              name: "University of Sarajevo",
              city: "Sarajevo",
              entity: "FBIH",
              ownership: "PUBLIC",
            },
          }}
          index={0}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    const detailButton = screen.getByRole("button", {
      name: /View details/i,
    });
    await userEvent.click(detailButton);

    expect(screen.getByText("University of Sarajevo")).toBeInTheDocument();
  });
});

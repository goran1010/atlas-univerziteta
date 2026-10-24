import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PendingUniversityChanges } from "../../../../src/components/ContributionDashboard/PendingUniversityChanges";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { PendingChange } from "../../../../src/schemas/pendingChange";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <RootContextProvider>{children}</RootContextProvider>;
}

function StatefulHarness({ initial }: { initial: PendingChange[] }) {
  const [changes, setChanges] = useState(initial);
  return (
    <RootContextProvider>
      <Notifications />
      <PendingUniversityChanges
        loading={false}
        pendingChanges={changes}
        setPendingChanges={setChanges}
      />
    </RootContextProvider>
  );
}

const pendingChanges: PendingChange[] = [
  {
    id: "1",
    targetType: "UNIVERSITY",
    typeOfChange: "CREATE",
    data: {
      name: "University of Sarajevo",
      city: "Sarajevo",
      entity: "FBIH",
      ownership: "PUBLIC",
    },
    targetId: null,
    parentId: null,
    userId: "user-123",
    createdAt: new Date(),
    user: {
      role: "ADMIN",
      email: "user-123@example.com",
    },
  },
  {
    id: "2",
    targetType: "FACULTY",
    typeOfChange: "UPDATE",
    data: { name: "Faculty of Engineering" },
    targetId: 2,
    parentId: null,
    userId: "user-456",
    createdAt: new Date(),
    user: {
      role: "ADMIN",
      email: "user-456@example.com",
    },
  },
];

describe("PendingUniversityChanges", () => {
  test("renders spinner when loading", () => {
    render(
      <Wrapper>
        <PendingUniversityChanges
          loading={true}
          pendingChanges={[]}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("renders no pending changes message", () => {
    render(
      <Wrapper>
        <PendingUniversityChanges
          loading={false}
          pendingChanges={[]}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    expect(
      screen.getByText(/No pending changes to display\./i),
    ).toBeInTheDocument();
  });

  test("renders a row for every pending change", () => {
    render(
      <Wrapper>
        <PendingUniversityChanges
          loading={false}
          pendingChanges={pendingChanges}
          setPendingChanges={vi.fn()}
        />
      </Wrapper>,
    );

    expect(
      within(screen.getByRole("rowgroup")).getAllByRole("row"),
    ).toHaveLength(2);
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  test("discarding a change removes its row and notifies", async () => {
    let discardedId: string | undefined;
    server.use(
      http.delete(
        "*/users/contribution/pending-changes/universities",
        async ({ request }) => {
          discardedId = ((await request.json()) as { id: string }).id;
          return HttpResponse.json({
            data: null,
            message: "Pending change discarded successfully.",
          });
        },
      ),
    );
    render(<StatefulHarness initial={pendingChanges} />);
    const user = userEvent.setup();

    const deleteButtons = screen.getAllByRole("button", { name: /^Delete$/i });
    expect(deleteButtons).toHaveLength(2);
    await user.click(deleteButtons[0]);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Delete$/i,
      }),
    );

    expect(
      await screen.findByText(/Pending change discarded\./i),
    ).toBeInTheDocument();
    expect(discardedId).toBe("1");
    // the discarded row's badge disappears, the other row stays
    await waitFor(() => {
      expect(screen.queryByText("Create")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Update")).toBeInTheDocument();
  });
});

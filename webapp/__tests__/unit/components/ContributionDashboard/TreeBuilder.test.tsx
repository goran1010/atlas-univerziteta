import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddUniversityEntity } from "../../../../src/components/ContributionDashboard/AddUniversityEntity";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { ReactElement } from "react";
import { nth } from "../../../utils/nth";

let submissions: Record<string, unknown>[] = [];

beforeEach(() => {
  submissions = [];
  server.use(
    // echoes the request back as a valid pending change so the response
    // passes the schema parse and the component's real success path runs
    http.post("*/users/contribution/universities", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      submissions.push(body);
      return HttpResponse.json(
        {
          message: "Suggestion submitted.",
          data: {
            id: "11111111-2222-4333-8444-555555555555",
            userId: "test-id",
            targetType: body["targetType"],
            typeOfChange: "CREATE",
            targetId: null,
            parentId: null,
            data: body["data"] ?? {},
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      );
    }),
  );
});

function Wrapper({ children }: { children: ReactElement }) {
  return (
    <RootContextProvider>
      <Notifications />
      {children}
    </RootContextProvider>
  );
}

function renderForm(refetchPendingChanges = vi.fn()) {
  render(
    <Wrapper>
      <AddUniversityEntity refetchPendingChanges={refetchPendingChanges} />
    </Wrapper>,
  );
  return refetchPendingChanges;
}

async function fillRootUniversity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    nth(screen.getAllByRole("textbox", { name: /^Name/ })),
    "Builder Uni",
  );
  await user.type(screen.getByRole("textbox", { name: /^City/ }), "Testograd");
  await user.selectOptions(
    screen.getByRole("combobox", { name: /^Country/ }),
    "BIH",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: /^Entity/ }),
    "FBIH",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: /Ownership/ }),
    "PUBLIC",
  );
}

describe("tree builder in AddUniversityEntity", () => {
  test("builds and submits a nested university tree", async () => {
    const user = userEvent.setup();
    const refetch = renderForm();

    await fillRootUniversity(user);

    await user.click(screen.getByRole("button", { name: "Add faculty" }));
    await user.click(screen.getByRole("button", { name: "Add study program" }));
    await user.click(screen.getByRole("button", { name: "Add track" }));

    const nameBoxes = screen.getAllByRole("textbox", { name: /^Name/ });
    expect(nameBoxes).toHaveLength(4);
    await user.type(nth(nameBoxes, 1), "Builder Faculty");
    await user.type(nth(nameBoxes, 2), "Builder Program");
    await user.type(nth(nameBoxes, 3), "Builder Track");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Study cycle/ }),
      "FIRST",
    );

    await user.click(
      screen.getByRole("button", { name: /Submit suggestion/i }),
    );

    await waitFor(() => {
      expect(submissions).toHaveLength(1);
    });
    expect(submissions[0]).toEqual({
      targetType: "UNIVERSITY",
      data: {
        name: "Builder Uni",
        city: "Testograd",
        country: "BIH",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [
          {
            name: "Builder Faculty",
            studyPrograms: [
              {
                name: "Builder Program",
                cycle: "FIRST",
                tracks: [{ name: "Builder Track" }],
              },
            ],
          },
        ],
      },
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    // the builder resets with the form
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
  });

  test("shows path-addressed issues for duplicate faculty names and sends nothing", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRootUniversity(user);
    await user.click(screen.getByRole("button", { name: "Add faculty" }));
    await user.click(screen.getByRole("button", { name: "Add faculty" }));

    const nameBoxes = screen.getAllByRole("textbox", { name: /^Name/ });
    await user.type(nth(nameBoxes, 1), "Same Faculty");
    await user.type(nth(nameBoxes, 2), "Same Faculty");

    await user.click(
      screen.getByRole("button", { name: /Submit suggestion/i }),
    );

    expect(await screen.findByText("Validation errors")).toBeInTheDocument();
    expect(
      screen.getByText(/faculties\.1\.name: Duplicate faculty name/),
    ).toBeInTheDocument();
    expect(submissions).toHaveLength(0);
  });

  test("removing a faculty removes its whole subtree", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRootUniversity(user);
    await user.click(screen.getByRole("button", { name: "Add faculty" }));
    await user.click(screen.getByRole("button", { name: "Add study program" }));
    expect(screen.getAllByRole("textbox", { name: /^Name/ })).toHaveLength(3);

    await user.click(nth(screen.getAllByRole("button", { name: "Remove" })));

    expect(screen.getAllByRole("textbox", { name: /^Name/ })).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: /Submit suggestion/i }),
    );
    await waitFor(() => {
      expect(submissions).toHaveLength(1);
    });
    // no children left, so the payload is the plain flat create
    expect(submissions[0]?.["data"]).toEqual({
      name: "Builder Uni",
      city: "Testograd",
      country: "BIH",
      entity: "FBIH",
      ownership: "PUBLIC",
    });
  });

  test("collapsing a card hides its fields without losing them", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillRootUniversity(user);
    await user.click(screen.getByRole("button", { name: "Add faculty" }));

    const nameBoxes = screen.getAllByRole("textbox", { name: /^Name/ });
    await user.type(nth(nameBoxes, 1), "Folded Faculty");

    await user.click(screen.getByRole("button", { name: "Collapse" }));
    expect(screen.getAllByRole("textbox", { name: /^Name/ })).toHaveLength(1);
    expect(screen.getByText("Folded Faculty")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getAllByRole("textbox", { name: /^Name/ })[1]).toHaveValue(
      "Folded Faculty",
    );
  });
});

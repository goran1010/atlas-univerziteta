import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTreeEntity } from "../../../../src/components/ContributionDashboard/AddTreeEntity";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { ReactElement } from "react";

const validTreeJson = JSON.stringify({
  name: "Paste University",
  city: "Mostar",
  country: "BIH",
      entity: "FBIH",
  ownership: "PRIVATE",
  faculties: [
    {
      name: "Fakultet A",
      studyPrograms: [
        {
          name: "Program X",
          cycle: "FIRST",
          ects: 180,
          tracks: [{ name: "Smjer 1" }],
        },
      ],
    },
    { name: "Fakultet B" },
  ],
});

let submissions: Record<string, unknown>[] = [];

beforeEach(() => {
  submissions = [];
  server.use(
    http.get("*/api/v1/universities", () =>
      HttpResponse.json({
        message: "ok",
        data: [
          {
            id: 1,
            name: "University of Sarajevo",
            acronym: "UNSA",
            city: "Sarajevo",
            country: "BIH",
      entity: "FBIH",
            ownership: "PUBLIC",
          },
        ],
        page: 1,
        totalPages: 1,
        total: 1,
      }),
    ),
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
            parentId:
              body["parentId"] == null ? null : Number(body["parentId"]),
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

function renderTree(refetchPendingChanges = vi.fn()) {
  render(
    <Wrapper>
      <AddTreeEntity refetchPendingChanges={refetchPendingChanges} />
    </Wrapper>,
  );
  return refetchPendingChanges;
}

async function pasteJson(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) {
  const textarea = screen.getByRole("textbox", { name: /JSON data/i });
  await user.click(textarea);
  await user.paste(text);
}

describe("AddTreeEntity", () => {
  test("shows an error for text that is not JSON", async () => {
    const user = userEvent.setup();
    renderTree();

    await pasteJson(user, "{oops");
    await user.click(screen.getByRole("button", { name: /Validate/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The text is not valid JSON.",
    );
    expect(
      screen.getByRole("button", { name: /Submit suggestion/i }),
    ).toBeDisabled();
  });

  test("shows path-addressed validation errors for an invalid tree", async () => {
    const user = userEvent.setup();
    renderTree();

    await pasteJson(
      user,
      JSON.stringify({
        name: "Broken University",
        city: "Mostar",
        country: "BIH",
      entity: "FBIH",
        ownership: "PRIVATE",
        faculties: [{ name: "Same" }, { name: "Same" }],
      }),
    );
    await user.click(screen.getByRole("button", { name: /Validate/i }));

    expect(screen.getByText("Validation errors")).toBeInTheDocument();
    expect(
      screen.getByText(/faculties\.1\.name: Duplicate faculty name/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit suggestion/i }),
    ).toBeDisabled();
  });

  test("hints at the type mix-up when a university is pasted as a faculty", async () => {
    const user = userEvent.setup();
    renderTree();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "FACULTY",
    );
    await pasteJson(user, validTreeJson);
    await user.click(screen.getByRole("button", { name: /Validate/i }));

    expect(
      screen.getByText(
        "This looks like a whole university. Switch the item type to University.",
      ),
    ).toBeInTheDocument();
  });

  test("previews a valid tree, submits it, and resets the form", async () => {
    const user = userEvent.setup();
    const refetch = renderTree();

    const submitButton = screen.getByRole("button", {
      name: /Submit suggestion/i,
    });
    expect(submitButton).toBeDisabled();

    await pasteJson(user, validTreeJson);
    await user.click(screen.getByRole("button", { name: /Validate/i }));

    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Faculties (2)")).toBeInTheDocument();
    expect(screen.getAllByText("Program X")).toHaveLength(2);
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(submissions).toHaveLength(1);
    });
    expect(submissions[0]).toEqual({
      targetType: "UNIVERSITY",
      data: JSON.parse(validTreeJson) as Record<string, unknown>,
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: /JSON data/i })).toHaveValue("");
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
  });

  test("editing the JSON invalidates a previous validation", async () => {
    const user = userEvent.setup();
    renderTree();

    await pasteJson(user, validTreeJson);
    await user.click(screen.getByRole("button", { name: /Validate/i }));
    expect(screen.getByText("Preview")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: /JSON data/i }),
      " edited",
    );

    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit suggestion/i }),
    ).toBeDisabled();
  });

  test("a faculty subtree requires a picked parent before submitting", async () => {
    const user = userEvent.setup();
    renderTree();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "FACULTY",
    );

    await pasteJson(
      user,
      JSON.stringify({
        name: "Subtree Faculty",
        studyPrograms: [{ name: "Program A", cycle: "FIRST" }],
      }),
    );
    await user.click(screen.getByRole("button", { name: /Validate/i }));

    const submitButton = screen.getByRole("button", {
      name: /Submit suggestion/i,
    });
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    await screen.findByRole("option", {
      name: /University of Sarajevo \(UNSA\)/i,
    });
    await user.selectOptions(universitySelect, "1");

    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitFor(() => {
      expect(submissions).toHaveLength(1);
    });
    expect(submissions[0]?.["parentId"]).toBe(1);
    expect(submissions[0]?.["targetType"]).toBe("FACULTY");
  });

  test("loads JSON from a file into the textarea", async () => {
    const user = userEvent.setup();
    renderTree();

    const file = new File([validTreeJson], "tree.json", {
      type: "application/json",
    });
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    if (!input) return;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /JSON data/i })).toHaveValue(
        validTreeJson,
      );
    });
  });
});

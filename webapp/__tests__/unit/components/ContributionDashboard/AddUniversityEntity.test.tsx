import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddUniversityEntity } from "../../../../src/components/ContributionDashboard/AddUniversityEntity";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

import type { ReactElement } from "react";
import { nth } from "../../../utils/nth";

const universitiesList = [
  {
    id: 1,
    name: "University of Sarajevo",
    acronym: "UNSA",
    city: "Sarajevo",
    country: "BIH",
    entity: "FBIH",
    ownership: "PUBLIC",
  },
];

const universityDetail = {
  ...universitiesList[0],
  faculties: [
    {
      id: 3,
      name: "Faculty of Electrical Engineering",
      universityId: 1,
      studyPrograms: [
        {
          id: 7,
          name: "Computer Science",
          facultyId: 3,
          cycle: "FIRST",
          ects: 180,
          tracks: [
            {
              id: 11,
              name: "Software Track",
              studyProgramId: 7,
              ects: 60,
              durationYears: 1,
            },
          ],
        },
      ],
    },
  ],
};

interface CapturedSubmission {
  method: "POST" | "PUT" | "DELETE";
  body: Record<string, unknown>;
}

let universitiesRequests = 0;
let submissions: CapturedSubmission[] = [];

// echoes the request back as a valid pending change so the response passes
// the schema parse and the component's real success path runs
function submissionResponse(
  typeOfChange: "CREATE" | "UPDATE",
  body: Record<string, unknown>,
) {
  return HttpResponse.json(
    {
      message: "Suggestion submitted.",
      data: {
        id: "11111111-2222-4333-8444-555555555555",
        userId: "test-id",
        targetType: body["targetType"],
        typeOfChange,
        targetId: body["targetId"] == null ? null : Number(body["targetId"]),
        parentId: body["parentId"] == null ? null : Number(body["parentId"]),
        data: body["data"] ?? {},
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 },
  );
}

beforeEach(() => {
  universitiesRequests = 0;
  submissions = [];
  server.use(
    http.get("*/api/v1/universities", () => {
      universitiesRequests++;
      return HttpResponse.json({
        message: "ok",
        data: universitiesList,
        page: 1,
        totalPages: 1,
        total: universitiesList.length,
      });
    }),
    http.get("*/api/v1/universities/:id", () =>
      HttpResponse.json({ message: "ok", data: universityDetail }),
    ),
    http.post("*/users/contribution/universities", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      submissions.push({ method: "POST", body });
      return submissionResponse("CREATE", body);
    }),
    http.put("*/users/contribution/universities", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      submissions.push({ method: "PUT", body });
      return submissionResponse("UPDATE", body);
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

async function pickUniversity(user: ReturnType<typeof userEvent.setup>) {
  const universitySelect = await screen.findByRole("combobox", {
    name: /^University$/i,
  });
  await screen.findByRole("option", {
    name: /University of Sarajevo \(UNSA\)/i,
  });
  await user.selectOptions(universitySelect, "1");
}

async function pickFaculty(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", {
    name: /Faculty of Electrical Engineering/i,
  });
  await user.selectOptions(
    screen.getByRole("combobox", { name: /^Faculty$/i }),
    "3",
  );
}

async function pickStudyProgram(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", { name: /Computer Science/i });
  await user.selectOptions(
    screen.getByRole("combobox", { name: /^Study Program$/i }),
    "7",
  );
}

async function pickTrack(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", { name: /Software Track/i });
  await user.selectOptions(
    screen.getByRole("combobox", { name: /^Track/i }),
    "11",
  );
}

describe("AddUniversityEntity", () => {
  test("renders university create fields when university is selected", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();
    const targetType = screen.getByRole("combobox", { name: /Item type/i });

    await user.selectOptions(targetType, "UNIVERSITY");

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^Country$/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Ownership/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    ).toBeInTheDocument();
    expect(universitiesRequests).toBe(0);
  });

  test("renders the entity picker and hides data fields for delete changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "FACULTY",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Change/i }),
      "DELETE",
    );

    expect(
      await screen.findByRole("combobox", { name: /^University$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^Faculty$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Which item do you want to change\?/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
  });

  test("renders parent picker and study program fields for create changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "STUDY_PROGRAM",
    );

    expect(
      await screen.findByRole("combobox", { name: /^University$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^Faculty$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Where should the new item be added\?/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Cycle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ECTS credits/i)).toBeInTheDocument();
  });

  test("renders parent picker and track fields for create changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "TRACK",
    );

    expect(
      await screen.findByRole("combobox", { name: /^University$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^Study Program$/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ECTS credits/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  test("shows current data and data fields for update changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "UNIVERSITY",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Change/i }),
      "UPDATE",
    );

    await pickUniversity(user);

    expect(await screen.findByText(/Current data/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/University of Sarajevo/i).length,
    ).toBeGreaterThan(1);
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
  });

  async function startUniversityUpdate(
    user: ReturnType<typeof userEvent.setup>,
  ) {
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "UNIVERSITY",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Change/i }),
      "UPDATE",
    );
    await pickUniversity(user);
    // prefill has landed once the name input shows the current value
    expect(
      await screen.findByDisplayValue("University of Sarajevo"),
    ).toBeInTheDocument();
  }

  test("prefills the form with the target's current data on update", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );
    const user = userEvent.setup();

    await startUniversityUpdate(user);

    expect(screen.getByLabelText(/Name/i)).toHaveValue(
      "University of Sarajevo",
    );
    expect(screen.getByLabelText(/City/i)).toHaveValue("Sarajevo");
    expect(screen.getByLabelText(/Acronym/i)).toHaveValue("UNSA");
  });

  test("submits only the fields that changed on update", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );
    const user = userEvent.setup();

    await startUniversityUpdate(user);
    await user.clear(screen.getByLabelText(/City/i));
    await user.type(screen.getByLabelText(/City/i), "Mostar");
    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/Suggestion submitted./i),
    ).toBeInTheDocument();
    expect(submissions).toHaveLength(1);
    expect(submissions[0]?.body).toEqual({
      targetType: "UNIVERSITY",
      targetId: 1,
      data: { city: "Mostar" },
    });
  });

  test("sends null for an emptied clearable field on update", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );
    const user = userEvent.setup();

    await startUniversityUpdate(user);
    await user.clear(screen.getByLabelText(/Acronym/i));
    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/Suggestion submitted./i),
    ).toBeInTheDocument();
    expect(submissions[0]?.body).toEqual({
      targetType: "UNIVERSITY",
      targetId: 1,
      data: { acronym: null },
    });
  });

  test("blocks an update that changes nothing", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );
    const user = userEvent.setup();

    await startUniversityUpdate(user);
    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/matches the current data/i),
    ).toBeInTheDocument();
    expect(submissions).toHaveLength(0);
  });

  test("resets the picker when entity type changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "UNIVERSITY",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Change/i }),
      "DELETE",
    );
    await pickUniversity(user);

    expect(screen.getByRole("combobox", { name: /^University$/i })).toHaveValue(
      "1",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "FACULTY",
    );

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    expect(universitySelect).toHaveValue("");
  });

  test("submits a university create suggestion and resets the form", async () => {
    const refetchPendingChanges = vi.fn();

    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={refetchPendingChanges} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "UNIVERSITY",
    );
    await user.type(screen.getByLabelText(/Name/i), "University of Sarajevo");
    await user.type(screen.getByLabelText(/City/i), "Sarajevo");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Country$/i }),
      "BIH",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Entity$/i }),
      "FBIH",
    );
    await user.selectOptions(screen.getByLabelText(/Ownership/i), "PUBLIC");

    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/Suggestion submitted./i),
    ).toBeInTheDocument();

    expect(submissions).toHaveLength(1);
    expect(submissions[0]?.method).toBe("POST");
    expect(submissions[0]?.body).toEqual({
      targetType: "UNIVERSITY",
      data: {
        name: "University of Sarajevo",
        city: "Sarajevo",
        country: "BIH",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });
    expect(refetchPendingChanges).toHaveBeenCalled();
    expect(screen.getByLabelText(/Name/i)).toHaveValue("");
    expect(screen.getByRole("combobox", { name: /Item type/i })).toHaveValue(
      "UNIVERSITY",
    );
  });

  test("submits the contributor comment and resets it with the form", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Name/i), "Commented University");
    await user.type(screen.getByLabelText(/City/i), "Sarajevo");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Country$/i }),
      "BIH",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Entity$/i }),
      "FBIH",
    );
    await user.selectOptions(screen.getByLabelText(/Ownership/i), "PUBLIC");
    await user.type(
      screen.getByLabelText(/Comment for the admin/i),
      "Found on the official site",
    );

    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/Suggestion submitted./i),
    ).toBeInTheDocument();

    expect(submissions[0]?.body).toEqual(
      expect.objectContaining({ comment: "Found on the official site" }),
    );
    expect(screen.getByLabelText(/Comment for the admin/i)).toHaveValue("");
  });

  test("submits track data with the picked target id on update", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "TRACK",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Change/i }),
      "UPDATE",
    );

    await pickUniversity(user);
    await pickFaculty(user);
    await pickStudyProgram(user);
    await pickTrack(user);

    expect(await screen.findByText(/Current data/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Name/i), "Software Track");
    await user.type(screen.getByLabelText(/ECTS credits/i), "60");
    await user.type(screen.getByLabelText(/Duration/i), "1");

    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/Suggestion submitted./i),
    ).toBeInTheDocument();

    expect(submissions).toHaveLength(1);
    const submission = nth(submissions);
    expect(submission.method).toBe("PUT");
    expect(submission.body).toMatchObject({
      targetType: "TRACK",
      data: {
        name: "Software Track",
        ects: 60,
        durationYears: 1,
      },
    });
    expect(Number(submission.body["targetId"])).toBe(11);
  });

  test("submits study program data with the picked parent id", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity refetchPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Item type/i }),
      "STUDY_PROGRAM",
    );

    await pickUniversity(user);
    await pickFaculty(user);

    await user.type(screen.getByLabelText(/Name/i), "Computer Science");
    await user.selectOptions(screen.getByLabelText(/Cycle/i), "FIRST");
    await user.type(screen.getByLabelText(/Duration/i), "3");
    await user.type(screen.getByLabelText(/ECTS credits/i), "180");

    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    expect(
      await screen.findByText(/Suggestion submitted./i),
    ).toBeInTheDocument();

    expect(submissions).toHaveLength(1);
    const submission = nth(submissions);
    expect(submission.method).toBe("POST");
    expect(submission.body).toMatchObject({
      targetType: "STUDY_PROGRAM",
      data: {
        name: "Computer Science",
        cycle: "FIRST",
        durationYears: 3,
        ects: 180,
      },
    });
    expect(Number(submission.body["parentId"])).toBe(3);
  });
});

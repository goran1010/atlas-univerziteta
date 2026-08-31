import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddUniversityEntity } from "../../../../src/components/ContributionDashboard/AddUniversityEntity";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { ReactElement } from "react";
import type { PendingChange } from "../../../../src/schemas/pendingChange";
import type { HandleSubmitUniversityEntityParams } from "../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity";

const handleSubmitUniversityEntityMock =
  vi.fn<(args: HandleSubmitUniversityEntityParams) => undefined>();

vi.mock(
  "../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity",
  () => ({
    handleSubmitUniversityEntity: (
      args: HandleSubmitUniversityEntityParams,
    ) => {
      handleSubmitUniversityEntityMock(args);
    },
  }),
);

const universitiesList = [
  {
    id: 1,
    name: "University of Sarajevo",
    acronym: "UNSA",
    city: "Sarajevo",
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

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ message: "ok", data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function setupFetchMock() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.endsWith("/api/v1/universities")) {
      return Promise.resolve(jsonResponse(universitiesList));
    }
    if (url.includes("/api/v1/universities/")) {
      return Promise.resolve(jsonResponse(universityDetail));
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

function Wrapper({ children }: { children: ReactElement }) {
  return <RootContextProvider>{children}</RootContextProvider>;
}

function expectSubmitArgs() {
  const submittedArgs = handleSubmitUniversityEntityMock.mock.calls[0]?.[0];

  expect(submittedArgs).toBeDefined();

  return submittedArgs;
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

beforeEach(() => {
  localStorage.setItem("language", "en");
  handleSubmitUniversityEntityMock.mockReset();
  setupFetchMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AddUniversityEntity", () => {
  test("renders university create fields when university is selected", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();
    const entityType = screen.getByRole("combobox", { name: /Entity Type/i });

    await user.selectOptions(entityType, "UNIVERSITY");

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Entity( \*)?$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ownership/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("renders the entity picker and hides data fields for delete changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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

  test("resets the picker when entity type changes", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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
      screen.getByRole("combobox", { name: /Entity Type/i }),
      "FACULTY",
    );

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    expect(universitySelect).toHaveValue("");
  });

  test("submits the selected entity data through the handler", async () => {
    const setPendingChanges =
      vi.fn<(value: React.SetStateAction<PendingChange[]>) => void>();

    render(
      <Wrapper>
        <AddUniversityEntity setPendingChanges={setPendingChanges} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
      "UNIVERSITY",
    );
    await user.type(screen.getByLabelText(/Name/i), "University of Sarajevo");
    await user.type(screen.getByLabelText(/City/i), "Sarajevo");
    await user.selectOptions(screen.getByLabelText(/^Entity( \*)?$/i), "FBIH");
    await user.selectOptions(screen.getByLabelText(/Ownership/i), "PUBLIC");

    await user.click(
      screen.getByRole("button", { name: /Submit Suggestion/i }),
    );

    const submittedArgs = expectSubmitArgs();

    expect(submittedArgs.entityType).toBe("UNIVERSITY");
    expect(submittedArgs.parentId).toBe("");
    expect(submittedArgs.targetId).toBe("");
    expect(submittedArgs.typeOfChange).toBe("CREATE");
    expect(submittedArgs.data).toMatchObject({
      name: "University of Sarajevo",
      city: "Sarajevo",
      entity: "FBIH",
      ownership: "PUBLIC",
    });
    expect(submittedArgs.setPendingChanges).toBe(setPendingChanges);
    expect(typeof submittedArgs.setFormState).toBe("function");
    expect(typeof submittedArgs.ctx.addNotification).toBe("function");
    expect(typeof submittedArgs.ctx.setLoading).toBe("function");
    expect(typeof submittedArgs.ctx.t).toBe("function");
    expect(submittedArgs.ctx.serverStatus).toBe("live");

    act(() => {
      submittedArgs.setFormState({
        entityType: "UNIVERSITY",
        parentId: undefined,
        targetId: undefined,
        data: {},
      });
    });

    expect(screen.getByLabelText(/Name/i)).toHaveValue("");
    expect(screen.getByRole("combobox", { name: /Entity Type/i })).toHaveValue(
      "UNIVERSITY",
    );
  });

  test("submits track data with picked target id on update", async () => {
    const setPendingChanges =
      vi.fn<(value: React.SetStateAction<PendingChange[]>) => void>();

    render(
      <Wrapper>
        <AddUniversityEntity setPendingChanges={setPendingChanges} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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

    const submittedArgs = expectSubmitArgs();

    expect(submittedArgs.entityType).toBe("TRACK");
    expect(submittedArgs.targetId).toBe("11");
    expect(submittedArgs.typeOfChange).toBe("UPDATE");
    expect(submittedArgs.data).toMatchObject({
      name: "Software Track",
      ects: 60,
      durationYears: 1,
    });
    expect(submittedArgs.setPendingChanges).toBe(setPendingChanges);
  });

  test("submits study program data with picked parent id", async () => {
    render(
      <Wrapper>
        <AddUniversityEntity setPendingChanges={vi.fn()} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Entity Type/i }),
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

    const submittedArgs = expectSubmitArgs();

    expect(submittedArgs.entityType).toBe("STUDY_PROGRAM");
    expect(submittedArgs.parentId).toBe("3");
    expect(submittedArgs.typeOfChange).toBe("CREATE");
    expect(submittedArgs.data).toMatchObject({
      name: "Computer Science",
      cycle: "FIRST",
      durationYears: 3,
      ects: 180,
    });
  });
});

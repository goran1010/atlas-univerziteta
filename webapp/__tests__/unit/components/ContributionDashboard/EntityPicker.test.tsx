import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityPicker } from "../../../../src/components/ContributionDashboard/EntityPicker";
import { getPickerDepth } from "../../../../src/components/ContributionDashboard/utils/getPickerDepth";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

const universitiesList = [
  {
    id: 1,
    name: "University of Sarajevo",
    acronym: "UNSA",
    city: "Sarajevo",
    entity: "FBIH",
    ownership: "PUBLIC",
  },
  {
    id: 2,
    name: "Empty University",
    city: "Mostar",
    entity: "FBIH",
    ownership: "PRIVATE",
  },
];

const detailsById: Record<string, unknown> = {
  "1": {
    ...universitiesList[0],
    faculties: [
      {
        id: 3,
        name: "Faculty of Electrical Engineering",
        universityId: 1,
        studyPrograms: [],
      },
    ],
  },
  "2": {
    ...universitiesList[1],
    faculties: [],
  },
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
    const detailMatch = /\/api\/v1\/universities\/(\d+)$/.exec(url);
    if (detailMatch?.[1] && detailsById[detailMatch[1]]) {
      return Promise.resolve(jsonResponse(detailsById[detailMatch[1]]));
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

function renderPicker(depth: number, onSelect = vi.fn()) {
  render(
    <RootContextProvider>
      <Notifications />
      <EntityPicker
        depth={depth}
        legend="Pick"
        showSelectedDetails={false}
        onSelect={onSelect}
      />
    </RootContextProvider>,
  );
  return onSelect;
}

beforeEach(() => {
  localStorage.setItem("language", "en");
  setupFetchMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getPickerDepth", () => {
  test.each([
    ["UNIVERSITY", "CREATE", 0],
    ["UNIVERSITY", "UPDATE", 1],
    ["UNIVERSITY", "DELETE", 1],
    ["FACULTY", "CREATE", 1],
    ["FACULTY", "UPDATE", 2],
    ["STUDY_PROGRAM", "CREATE", 2],
    ["STUDY_PROGRAM", "DELETE", 3],
    ["SUBJECT", "CREATE", 3],
    ["SUBJECT", "UPDATE", 4],
  ] as const)("%s + %s needs depth %i", (entityType, typeOfChange, depth) => {
    expect(getPickerDepth(entityType, typeOfChange)).toBe(depth);
  });
});

describe("EntityPicker", () => {
  test("reports the university id at depth 1", async () => {
    const onSelect = renderPicker(1);
    const user = userEvent.setup();

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    await user.selectOptions(universitySelect, "1");

    expect(onSelect).toHaveBeenLastCalledWith("1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("clears the reported id until the deepest level is picked", async () => {
    const onSelect = renderPicker(2);
    const user = userEvent.setup();

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    await user.selectOptions(universitySelect, "1");

    expect(onSelect).toHaveBeenLastCalledWith("");

    await screen.findByRole("option", {
      name: /Faculty of Electrical Engineering/i,
    });
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Faculty$/i }),
      "3",
    );

    expect(onSelect).toHaveBeenLastCalledWith("3");
  });

  test("disables the next level when a university has no faculties", async () => {
    renderPicker(2);
    const user = userEvent.setup();

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    await user.selectOptions(universitySelect, "2");

    const facultySelect = await screen.findByRole("combobox", {
      name: /^Faculty$/i,
    });
    expect(facultySelect).toBeDisabled();
    expect(screen.getByText(/No faculties available/i)).toBeInTheDocument();
  });

  test("shows an error notification when the universities list fails to load", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "boom" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderPicker(1);

    expect(
      await screen.findByText(/Failed to load universities\./i),
    ).toBeInTheDocument();
  });
});

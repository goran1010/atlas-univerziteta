import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityPicker } from "../../../../src/components/ContributionDashboard/EntityPicker";
import { getPickerDepth } from "../../../../src/components/ContributionDashboard/utils/getPickerDepth";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { server, http, HttpResponse } from "../../../utils/msw";

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

let universitiesRequests = 0;
let detailRequests = 0;

beforeEach(() => {
  universitiesRequests = 0;
  detailRequests = 0;
  server.use(
    http.get("*/api/v1/universities", () => {
      universitiesRequests++;
      return HttpResponse.json({ message: "ok", data: universitiesList });
    }),
    http.get("*/api/v1/universities/:id", ({ params }) => {
      detailRequests++;
      const detail = detailsById[String(params.id)];
      if (!detail) {
        return HttpResponse.json(
          { error: { message: "University not found." } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ message: "ok", data: detail });
    }),
  );
});

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

describe("getPickerDepth", () => {
  test.each([
    ["UNIVERSITY", "CREATE", 0],
    ["UNIVERSITY", "UPDATE", 1],
    ["UNIVERSITY", "DELETE", 1],
    ["FACULTY", "CREATE", 1],
    ["FACULTY", "UPDATE", 2],
    ["STUDY_PROGRAM", "CREATE", 2],
    ["STUDY_PROGRAM", "DELETE", 3],
    ["TRACK", "CREATE", 3],
    ["TRACK", "UPDATE", 4],
  ] as const)("%s + %s needs depth %i", (entityType, typeOfChange, depth) => {
    expect(getPickerDepth(entityType, typeOfChange)).toBe(depth);
  });
});

describe("EntityPicker", () => {
  test("reports the university id at depth 1 without fetching details", async () => {
    const onSelect = renderPicker(1);
    const user = userEvent.setup();

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    await user.selectOptions(universitySelect, "1");

    expect(onSelect).toHaveBeenLastCalledWith("1");
    expect(universitiesRequests).toBe(1);
    expect(detailRequests).toBe(0);
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
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.get("*/api/v1/universities", () =>
        HttpResponse.json({ error: { message: "boom" } }, { status: 500 }),
      ),
    );

    renderPicker(1);

    expect(
      await screen.findByText(
        /Could not load universities\. Check your connection and try again\./i,
      ),
    ).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TargetPicker } from "../../../../src/components/ContributionDashboard/TargetPicker";
import { getPickerDepth } from "../../../../src/components/ContributionDashboard/utils/getPickerDepth";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { delay } from "msw";
import { server, http, HttpResponse } from "../../../utils/msw";

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
  {
    id: 2,
    name: "Empty University",
    city: "Mostar",
    country: "BIH",
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
        city: "Novi Grad",
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
      return HttpResponse.json({
        message: "ok",
        data: universitiesList,
        page: 1,
        totalPages: 1,
        total: universitiesList.length,
      });
    }),
    http.get("*/api/v1/universities/:id", ({ params }) => {
      detailRequests++;
      const detail = detailsById[String(params["id"])];
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

function renderPicker(
  depth: number,
  onSelect = vi.fn(),
  showSelectedDetails = false,
) {
  render(
    <RootContextProvider>
      <Notifications />
      <TargetPicker
        depth={depth}
        legend="Pick"
        showSelectedDetails={showSelectedDetails}
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
  ] as const)("%s + %s needs depth %i", (targetType, typeOfChange, depth) => {
    expect(getPickerDepth(targetType, typeOfChange)).toBe(depth);
  });
});

describe("TargetPicker", () => {
  test("walks every page of the university directory", async () => {
    server.use(
      http.get("*/api/v1/universities", ({ request }) => {
        universitiesRequests++;
        const page = new URL(request.url).searchParams.get("page");
        const item =
          page === "2"
            ? { ...universitiesList[0], id: 99, name: "Second Page University" }
            : universitiesList[0];
        return HttpResponse.json({
          message: "ok",
          data: [item],
          page: Number(page ?? "1"),
          totalPages: 2,
          total: 2,
        });
      }),
    );
    renderPicker(1);

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });

    expect(universitiesRequests).toBe(2);
    expect(universitySelect).toContainHTML("Second Page University");
  });

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

  test("shows the picked faculty details when enabled", async () => {
    renderPicker(2, vi.fn(), true);
    const user = userEvent.setup();

    await user.selectOptions(
      await screen.findByRole("combobox", { name: /^University$/i }),
      "1",
    );
    await screen.findByRole("option", {
      name: /Faculty of Electrical Engineering/i,
    });
    await user.selectOptions(
      screen.getByRole("combobox", { name: /^Faculty$/i }),
      "3",
    );

    expect(await screen.findByText("Novi Grad")).toBeInTheDocument();
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

describe("TargetPicker response ordering", () => {
  test("ignores an out-of-order detail response after re-picking", async () => {
    server.use(
      http.get("*/api/v1/universities/:id", async ({ params }) => {
        detailRequests++;
        // the first university's reply arrives after the second's
        if (String(params["id"]) === "1") await delay(200);
        return HttpResponse.json({
          message: "ok",
          data: detailsById[String(params["id"])],
        });
      }),
    );
    const user = userEvent.setup();
    renderPicker(2);

    const universitySelect = await screen.findByRole("combobox", {
      name: /^University$/i,
    });
    await screen.findByRole("option", { name: /University of Sarajevo/i });
    await user.selectOptions(universitySelect, "1");
    await user.selectOptions(universitySelect, "2");

    await waitFor(() => {
      expect(detailRequests).toBe(2);
    });
    // let the stale slow response settle
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(
      screen.queryByRole("option", { name: /Faculty of Electrical/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No faculties available/i)).toBeInTheDocument();
  });
});

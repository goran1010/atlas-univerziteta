import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TargetPicker } from "../../../../src/components/ContributionDashboard/TargetPicker";
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
let universitiesRequestUrls: URL[] = [];
let detailRequests = 0;

beforeEach(() => {
  universitiesRequests = 0;
  universitiesRequestUrls = [];
  detailRequests = 0;
  server.use(
    http.get("*/api/v1/universities", ({ request }) => {
      universitiesRequests++;
      universitiesRequestUrls.push(new URL(request.url));
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

async function pickCountry(
  user: ReturnType<typeof userEvent.setup>,
  country = "BIH",
) {
  await user.selectOptions(
    screen.getByRole("combobox", { name: /^Country$/i }),
    country,
  );
}

async function findLoadedUniversitySelect() {
  await screen.findByRole("option", { name: /University of Sarajevo/i });
  return screen.getByRole("combobox", { name: /^University$/i });
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
  test("loads no universities until a country is picked", () => {
    renderPicker(1);

    expect(
      screen.getByRole("combobox", { name: /^University$/i }),
    ).toBeDisabled();
    expect(universitiesRequests).toBe(0);
  });

  test("loads the picked country's universities", async () => {
    renderPicker(1);
    const user = userEvent.setup();

    await pickCountry(user, "BIH");
    const universitySelect = await findLoadedUniversitySelect();

    expect(universitySelect).toBeEnabled();
    expect(universitiesRequestUrls[0]?.searchParams.get("country")).toBe("BIH");
  });

  test("clears the picked university and reports no id when the country changes", async () => {
    const onSelect = renderPicker(1);
    const user = userEvent.setup();

    await pickCountry(user, "BIH");
    await user.selectOptions(await findLoadedUniversitySelect(), "1");
    expect(onSelect).toHaveBeenLastCalledWith("1");

    await pickCountry(user, "SRB");

    expect(onSelect).toHaveBeenLastCalledWith("");
    await waitFor(() => {
      expect(universitiesRequestUrls.at(-1)?.searchParams.get("country")).toBe(
        "SRB",
      );
    });
    expect(
      await screen.findByRole("combobox", { name: /^University$/i }),
    ).toHaveValue("");
  });

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
    await pickCountry(userEvent.setup());

    await screen.findByRole("option", { name: /Second Page University/i });

    expect(universitiesRequests).toBe(2);
  });

  test("reports the university id at depth 1 without fetching details", async () => {
    const onSelect = renderPicker(1);
    const user = userEvent.setup();

    await pickCountry(user);
    await user.selectOptions(await findLoadedUniversitySelect(), "1");

    expect(onSelect).toHaveBeenLastCalledWith("1");
    expect(universitiesRequests).toBe(1);
    expect(detailRequests).toBe(0);
  });

  test("clears the reported id until the deepest level is picked", async () => {
    const onSelect = renderPicker(2);
    const user = userEvent.setup();

    await pickCountry(user);
    await user.selectOptions(await findLoadedUniversitySelect(), "1");

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

    await pickCountry(user);
    await user.selectOptions(await findLoadedUniversitySelect(), "2");

    const facultySelect = await screen.findByRole("combobox", {
      name: /^Faculty$/i,
    });
    expect(facultySelect).toBeDisabled();
    expect(screen.getByText(/No faculties available/i)).toBeInTheDocument();
  });

  test("shows the picked faculty details when enabled", async () => {
    renderPicker(2, vi.fn(), true);
    const user = userEvent.setup();

    await pickCountry(user);
    await user.selectOptions(await findLoadedUniversitySelect(), "1");
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
    await pickCountry(userEvent.setup());

    expect(
      await screen.findByText(
        /Could not load universities\. Check your connection and try again\./i,
      ),
    ).toBeInTheDocument();
  });
});

describe("TargetPicker response ordering", () => {
  test("ignores an out-of-order detail response after re-picking", async () => {
    let resolveStale!: () => void;
    const staleReady = new Promise<void>((r) => {
      resolveStale = r;
    });

    server.use(
      http.get("*/api/v1/universities/:id", async ({ params }) => {
        if (String(params["id"]) === "1") await staleReady;
        detailRequests++;
        return HttpResponse.json({
          message: "ok",
          data: detailsById[String(params["id"])],
        });
      }),
    );
    const user = userEvent.setup();
    renderPicker(2);

    await pickCountry(user);
    const universitySelect = await findLoadedUniversitySelect();
    await user.selectOptions(universitySelect, "1");
    await user.selectOptions(universitySelect, "2");

    await screen.findByText(/No faculties available/i);

    resolveStale();
    await waitFor(() => {
      expect(detailRequests).toBe(2);
    });

    expect(
      screen.queryByRole("option", { name: /Faculty of Electrical/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No faculties available/i)).toBeInTheDocument();
  });

  test("ignores an out-of-order university list after re-picking the country", async () => {
    let resolveStale!: () => void;
    const staleReady = new Promise<void>((r) => {
      resolveStale = r;
    });
    let staleServed = false;

    server.use(
      http.get("*/api/v1/universities", async ({ request }) => {
        const country = new URL(request.url).searchParams.get("country");
        if (country === "BIH") {
          await staleReady;
          staleServed = true;
        }
        const data =
          country === "BIH"
            ? universitiesList
            : [{ ...universitiesList[0], id: 7, name: "Serbian University" }];
        return HttpResponse.json({
          message: "ok",
          data,
          page: 1,
          totalPages: 1,
          total: data.length,
        });
      }),
    );
    const user = userEvent.setup();
    renderPicker(1);

    await pickCountry(user, "BIH");
    await pickCountry(user, "SRB");
    await screen.findByRole("option", { name: /Serbian University/i });

    resolveStale();
    await waitFor(() => {
      expect(staleServed).toBe(true);
    });

    expect(
      screen.queryByRole("option", { name: /University of Sarajevo/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Serbian University/i }),
    ).toBeInTheDocument();
  });
});

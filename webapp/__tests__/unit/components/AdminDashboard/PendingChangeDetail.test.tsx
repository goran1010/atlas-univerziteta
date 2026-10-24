import { render, screen } from "@testing-library/react";
import { PendingChangeDetail } from "../../../../src/components/AdminDashboard/PendingChangeDetail";
import { RootContextProvider } from "../../../utils/rootContextProvider";

function renderDetail(props: Parameters<typeof PendingChangeDetail>[0]) {
  render(
    <RootContextProvider>
      <PendingChangeDetail {...props} />
    </RootContextProvider>,
  );
}

describe("PendingChangeDetail", () => {
  test("shows proposed data with translated values and website link for CREATE", () => {
    renderDetail({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "New University",
        city: "Mostar",
        entity: "FBIH",
        ownership: "PUBLIC",
        website: "https://new.example",
      },
    });

    expect(screen.getByText("Proposed Data")).toBeInTheDocument();
    expect(screen.getByText("New University")).toBeInTheDocument();
    expect(screen.getByText("Mostar")).toBeInTheDocument();
    expect(screen.getByText(/Federation of B&H/i)).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /https:\/\/new\.example/i }),
    ).toHaveAttribute("href", "https://new.example");
  });

  test("shows current data next to proposed changes for UPDATE", () => {
    renderDetail({
      targetType: "FACULTY",
      typeOfChange: "UPDATE",
      data: { name: "New Faculty Name" },
      currentEntity: { name: "Old Faculty Name", city: "Sarajevo" },
    });

    expect(screen.getByText("Current Data")).toBeInTheDocument();
    expect(screen.getByText("Old Faculty Name")).toBeInTheDocument();
    expect(screen.getByText("Sarajevo")).toBeInTheDocument();
    expect(screen.getByText("Proposed Changes")).toBeInTheDocument();
    expect(screen.getByText("New Faculty Name")).toBeInTheDocument();
  });

  test("notes a deleted target for UPDATE when the entity is gone", () => {
    renderDetail({
      targetType: "FACULTY",
      typeOfChange: "UPDATE",
      data: { name: "New Faculty Name" },
      currentEntity: null,
    });

    expect(screen.getByText(/Entity no longer exists/i)).toBeInTheDocument();
    expect(screen.getByText("Proposed Changes")).toBeInTheDocument();
  });

  test("shows the current study program data for DELETE", () => {
    renderDetail({
      targetType: "STUDY_PROGRAM",
      typeOfChange: "DELETE",
      data: {},
      currentEntity: {
        name: "Computer Science",
        cycle: "FIRST",
        durationYears: 3,
        ects: 180,
      },
    });

    expect(screen.getByText("Current Data")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
  });

  test("notes a deleted target for DELETE when the entity is gone", () => {
    renderDetail({
      targetType: "TRACK",
      typeOfChange: "DELETE",
      data: {},
      currentEntity: undefined,
    });

    expect(screen.getByText(/Entity no longer exists/i)).toBeInTheDocument();
  });

  test("shows the acronym and faculty count for a university DELETE", () => {
    renderDetail({
      targetType: "UNIVERSITY",
      typeOfChange: "DELETE",
      data: {},
      currentEntity: {
        name: "Test University",
        acronym: "TU",
        facultyCount: 11,
      },
    });

    expect(screen.getByText("Acronym")).toBeInTheDocument();
    expect(screen.getByText("TU")).toBeInTheDocument();
    expect(screen.getByText("Faculties")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  test("shows child counts for faculty and study program current data", () => {
    renderDetail({
      targetType: "FACULTY",
      typeOfChange: "DELETE",
      data: {},
      currentEntity: { name: "Test Faculty", studyProgramCount: 4 },
    });

    expect(screen.getByText("Study programs")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    renderDetail({
      targetType: "STUDY_PROGRAM",
      typeOfChange: "DELETE",
      data: {},
      currentEntity: { name: "Test Program", trackCount: 2 },
    });

    expect(screen.getByText("Tracks")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

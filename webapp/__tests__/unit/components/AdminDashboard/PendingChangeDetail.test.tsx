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
  test("renders email and phone as mailto and tel links", () => {
    renderDetail({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Contact University",
        email: "info@uni.example",
        phone: "+387 33 123-456",
        address: "Obala Kulina bana 7",
      },
    });

    expect(
      screen.getByRole("link", { name: /info@uni.example/i }),
    ).toHaveAttribute("href", "mailto:info@uni.example");
    expect(
      screen.getByRole("link", { name: /\+387 33 123-456/i }),
    ).toHaveAttribute("href", "tel:+38733123456");
    expect(
      screen.getByRole("link", { name: /Obala Kulina bana 7/i }),
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Obala%20Kulina%20bana%207",
    );
  });

  test("shows proposed data with translated values and website link for CREATE", () => {
    renderDetail({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "New University",
        city: "Mostar",
        country: "BIH",
        entity: "FBIH",
        ownership: "PUBLIC",
        website: "https://new.example",
      },
    });

    expect(screen.getByText("Proposed Data")).toBeInTheDocument();
    expect(screen.getAllByText("New University")).toHaveLength(2);
    expect(screen.getByText("Mostar")).toBeInTheDocument();
    expect(screen.getByText(/Federation of B&H/i)).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /https:\/\/new\.example/i }),
    ).toHaveAttribute("href", "https://new.example");
  });

  test("shows a current vs proposed diff table for UPDATE", () => {
    renderDetail({
      targetType: "FACULTY",
      typeOfChange: "UPDATE",
      data: { name: "New Faculty Name", city: "Sarajevo", website: null },
      currentEntity: {
        name: "Old Faculty Name",
        city: "Sarajevo",
        website: "https://old.example",
      },
    });

    expect(screen.getByText("Proposed Changes")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Current" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Proposed" }),
    ).toBeInTheDocument();

    // the entity name heads the card and appears in the changed row
    expect(screen.getAllByText("Old Faculty Name")).toHaveLength(2);
    expect(screen.getByText("New Faculty Name")).toBeInTheDocument();
    // proposed value equal to current is flagged as a no-op
    expect(screen.getByText(/no change/i)).toBeInTheDocument();
    // null means the field is being cleared
    expect(screen.getByText(/cleared/i)).toBeInTheDocument();
  });

  test("names the entity above the table and lists only proposed fields", () => {
    renderDetail({
      targetType: "FACULTY",
      typeOfChange: "UPDATE",
      data: { phone: "+387 33 123 456" },
      currentEntity: {
        name: "Faculty of Science",
        city: "Sarajevo",
        phone: "+387 33 000 000",
      },
    });

    // the entity name is a heading line, not a table row
    expect(screen.getByText("Faculty of Science")).toBeInTheDocument();
    expect(
      screen.queryByRole("rowheader", { name: "Name" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("+387 33 123 456")).toBeInTheDocument();
    // city is untouched by the proposal, so it has no row
    expect(screen.queryByText("Sarajevo")).not.toBeInTheDocument();
  });

  test("notes a deleted target for UPDATE when the entity is gone", () => {
    renderDetail({
      targetType: "FACULTY",
      typeOfChange: "UPDATE",
      data: { name: "New Faculty Name" },
      currentEntity: null,
    });

    expect(screen.getByText(/This item no longer exists/i)).toBeInTheDocument();
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
    expect(screen.getAllByText("Computer Science")).toHaveLength(2);
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

    expect(screen.getByText(/This item no longer exists/i)).toBeInTheDocument();
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

  test("renders a university tree CREATE as nested card groups", () => {
    renderDetail({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Tree University",
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
      },
    });

    expect(screen.getByText("Proposed Data")).toBeInTheDocument();
    expect(screen.getByText("Faculties (2)")).toBeInTheDocument();
    // each node name appears as a card heading and as its Name row
    expect(screen.getAllByText("Fakultet A")).toHaveLength(2);
    expect(screen.getAllByText("Fakultet B")).toHaveLength(2);
    expect(screen.getByText("Study programs (1)")).toBeInTheDocument();
    expect(screen.getAllByText("Program X")).toHaveLength(2);
    expect(screen.getByText("FIRST - Bachelor")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("Tracks (1)")).toBeInTheDocument();
    expect(screen.getAllByText("Smjer 1")).toHaveLength(2);
  });

  test("renders a study program subtree CREATE with its tracks", () => {
    renderDetail({
      targetType: "STUDY_PROGRAM",
      typeOfChange: "CREATE",
      data: {
        name: "Subtree Program",
        cycle: "SECOND",
        tracks: [{ name: "Track One" }, { name: "Track Two", ects: 60 }],
      },
    });

    expect(screen.getByText("Tracks (2)")).toBeInTheDocument();
    expect(screen.getAllByText("Track One")).toHaveLength(2);
    expect(screen.getAllByText("Track Two")).toHaveLength(2);
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  test("renders no tree groups for a flat CREATE", () => {
    renderDetail({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Flat University",
        city: "Tuzla",
        country: "BIH",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    expect(screen.queryByText(/Faculties \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Study programs \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tracks \(/)).not.toBeInTheDocument();
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

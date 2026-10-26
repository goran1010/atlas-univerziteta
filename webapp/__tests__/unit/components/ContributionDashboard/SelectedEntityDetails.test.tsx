import { render, screen } from "@testing-library/react";
import { SelectedEntityDetails } from "../../../../src/components/ContributionDashboard/SelectedEntityDetails";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { PickedEntity } from "../../../../src/components/ContributionDashboard/TargetPicker";

const university: PickedEntity = {
  type: "UNIVERSITY",
  data: {
    id: 1,
    name: "University of Sarajevo",
    acronym: "UNSA",
    city: "Sarajevo",
    entity: "FBIH",
    ownership: "PUBLIC",
    foundedYear: undefined,
    website: "https://unsa.ba",
    address: undefined,
    phone: "+387 33 565 000",
    email: "info@unsa.ba",
    accreditationFrom: undefined,
    accreditationTo: undefined,
    authority: undefined,
    sourceUrl: undefined,
    lastModified: undefined,
    _count: { faculties: 0 },
  },
};

describe("SelectedEntityDetails", () => {
  test("renders website, phone, and email as links", () => {
    render(
      <RootContextProvider>
        <SelectedEntityDetails entity={university} />
      </RootContextProvider>,
    );

    expect(
      screen.getByRole("link", { name: /^https:\/\/unsa\.ba/ }),
    ).toHaveAttribute("href", "https://unsa.ba");
    expect(
      screen.getByRole("link", { name: /\+387 33 565 000/i }),
    ).toHaveAttribute("href", "tel:+38733565000");
    expect(
      screen.getByRole("link", { name: /info@unsa\.ba/i }),
    ).toHaveAttribute("href", "mailto:info@unsa.ba");
  });
});

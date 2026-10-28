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
    country: "BIH",
    entity: "FBIH",
    ownership: "PUBLIC",
    foundedYear: undefined,
    website: "https://unsa.ba",
    address: "Obala Kulina bana 7",
    phone: "+387 33 565 000",
    email: "info@unsa.ba",
    accreditationFrom: undefined,
    accreditationTo: undefined,
    authority: undefined,
    dataSourceUrl: "https://www.unsa.ba/o-univerzitetu",
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
    expect(
      screen.getByRole("link", { name: /Obala Kulina bana 7/i }),
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Obala%20Kulina%20bana%207",
    );
    expect(screen.getByText("Data source")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /^https:\/\/www\.unsa\.ba\/o-univerzitetu/,
      }),
    ).toHaveAttribute("href", "https://www.unsa.ba/o-univerzitetu");
  });
});

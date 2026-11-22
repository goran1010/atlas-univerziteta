import { render, screen } from "@testing-library/react";
import { Api } from "../../../../src/components/Api/Api";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { apiEndpoints } from "../../../../src/components/Api/utils/endpoints";
import { PUBLIC_API_URL } from "../../../../src/utils/envConfig";
import { COUNTRIES } from "../../../../src/schemas/domain";

function MockLanguageProvider({ children }: { children: React.ReactNode }) {
  return <RootContextProvider>{children}</RootContextProvider>;
}

function renderApi() {
  render(
    <MockLanguageProvider>
      <Api />
    </MockLanguageProvider>,
  );
}

describe("Api component", () => {
  test("renders the main REST API heading", async () => {
    renderApi();
    const heading = await screen.findByRole("heading", {
      name: /REST API/i,
      level: 1,
    });
    expect(heading).toBeInTheDocument();
  });

  test("renders the public API base URL", () => {
    renderApi();
    expect(screen.getByText(PUBLIC_API_URL)).toBeInTheDocument();
  });

  test("renders the data object section heading", () => {
    renderApi();
    expect(
      screen.getByRole("heading", { name: /University object/i, level: 2 }),
    ).toBeInTheDocument();
  });

  test("renders university schema snippet", () => {
    renderApi();
    const matches = screen.getAllByText(/FBIH/);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("renders the Endpoints section heading", () => {
    renderApi();
    expect(
      screen.getByRole("heading", { name: /^Endpoints$/i, level: 2 }),
    ).toBeInTheDocument();
  });

  test("renders all public endpoint paths", () => {
    renderApi();
    for (const ep of apiEndpoints) {
      expect(screen.getAllByText(ep.path).length).toBeGreaterThan(0);
    }
  });

  test("lists the valid country codes on every endpoint with a country filter", () => {
    renderApi();
    const withCountryFilter = apiEndpoints.filter((ep) =>
      ep.params?.some((param) => param.name === "country"),
    );

    expect(withCountryFilter.length).toBeGreaterThan(1);
    expect(
      screen.getAllByText(`Filter by country code: ${COUNTRIES.join(", ")}`),
    ).toHaveLength(withCountryFilter.length);
  });

  test("does not render authenticated endpoint docs", () => {
    renderApi();
    expect(
      screen.queryByRole("heading", {
        name: /Authenticated Data Contribution Flow/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("/auth/login")).not.toBeInTheDocument();
    expect(
      screen.queryByText("/users/admin/pending-changes"),
    ).not.toBeInTheDocument();
  });
});

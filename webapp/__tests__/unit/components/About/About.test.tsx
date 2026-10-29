import { render, screen } from "@testing-library/react";
import { About } from "../../../../src/components/About/About";
import { MemoryRouter } from "react-router";
import { RootContextProvider } from "../../../utils/rootContextProvider";

describe("About component", () => {
  test("renders every section and the developer links", async () => {
    render(
      <MemoryRouter>
        <RootContextProvider>
          <About />
        </RootContextProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /Universities and Study Programs/i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Explore the Data/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Improve the Data/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /For Developers/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View API Docs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Universities/i }),
    ).toBeInTheDocument();
  });
});

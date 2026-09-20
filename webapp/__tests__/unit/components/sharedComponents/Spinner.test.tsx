import { Spinner } from "../../../../src/components/sharedComponents/Spinner";
import { render, screen } from "@testing-library/react";
import { RootContextProvider } from "../../../utils/rootContextProvider";

describe("Spinner component", () => {
  test("renders the spinner correctly", () => {
    render(
      <RootContextProvider>
        <Spinner />
      </RootContextProvider>,
    );
    const spinnerElement = screen.getByRole("status", {
      name: /Loading/i,
    });
    expect(spinnerElement).toBeInTheDocument();
  });
});

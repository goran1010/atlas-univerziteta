import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultGroup } from "../../../../src/components/Home/ResultGroup";
import { RootContextProvider } from "../../../utils/rootContextProvider";

function renderGroup(props: Partial<Parameters<typeof ResultGroup>[0]> = {}) {
  render(
    <RootContextProvider>
      <ResultGroup label="First (Bachelor)" {...props}>
        <li>Computer Science</li>
      </ResultGroup>
    </RootContextProvider>,
  );
  return userEvent.setup();
}

describe("ResultGroup", () => {
  test("renders the label, count and children", () => {
    renderGroup({ count: 4 });

    expect(screen.getByText("First (Bachelor)")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });

  test("collapsible group toggles its children", async () => {
    const user = renderGroup({ collapsible: true });

    expect(screen.getByText("Computer Science")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Collapse/i }));
    expect(screen.queryByText("Computer Science")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });

  test("can start collapsed", async () => {
    const user = renderGroup({ collapsible: true, defaultCollapsed: true });

    expect(screen.queryByText("Computer Science")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });
});

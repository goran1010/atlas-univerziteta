import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultGroup } from "../../../../src/components/Search/ResultGroup";
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
    const user = renderGroup({ collapsible: true, count: 6 });

    expect(screen.getByText("Computer Science")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Collapse/i }));
    expect(screen.queryByText("Computer Science")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });

  test("hides the toggle on a group of five or fewer items", () => {
    renderGroup({ collapsible: true, count: 5 });

    expect(
      screen.queryByRole("button", { name: /Collapse/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });

  test("a small group that started collapsed can be collapsed again", async () => {
    const user = renderGroup({
      collapsible: true,
      defaultCollapsed: true,
      count: 2,
    });

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    await user.click(screen.getByRole("button", { name: /Collapse/i }));
    expect(screen.queryByText("Computer Science")).not.toBeInTheDocument();
  });

  test("can start collapsed", async () => {
    const user = renderGroup({ collapsible: true, defaultCollapsed: true });

    expect(screen.queryByText("Computer Science")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand/i }));
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });
});

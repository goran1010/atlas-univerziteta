import { render, screen } from "@testing-library/react";
import { Button } from "../../../../src/components/sharedComponents/Button";

describe("Button", () => {
  test("renders a non-submitting button by default", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
  });

  test("honors an explicit type", () => {
    render(<Button type="submit">Send</Button>);

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  test("disables the button and shows a spinner while loading", () => {
    render(<Button loading>Save</Button>);

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
    // the label stays mounted (hidden) so the button keeps its width
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  test("stays disabled when the disabled prop is set", () => {
    render(<Button disabled>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

import { render, screen } from "@testing-library/react";
import { Button } from "../../../../src/components/sharedComponents/Button";

describe("Button", () => {
  test("uses the primary variant by default", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("border-(--accent)/60");
  });

  test("uses the supplied variant", () => {
    render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });

    expect(button).toHaveClass("border-red-600/60");
    expect(button).not.toHaveClass("border-(--accent)/60");
  });
});

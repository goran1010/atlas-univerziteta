import { render, screen } from "@testing-library/react";
import { Button } from "../../../../src/components/sharedComponents/Button";

describe("Button", () => {
  test("uses the primary variant by default", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bg-(--accent)");
  });

  test("uses the supplied variant", () => {
    render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });

    expect(button).toHaveClass("bg-red-700");
    expect(button).not.toHaveClass("bg-(--accent)");
  });
});

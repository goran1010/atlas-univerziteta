import { render, screen } from "@testing-library/react";
import { Input } from "../../../../src/components/sharedComponents/Input";

describe("Input", () => {
  test("keeps the base styles when a className is supplied", () => {
    render(<Input className="flex-1" aria-label="Search" />);

    const input = screen.getByRole("textbox", { name: "Search" });

    expect(input).toHaveClass("flex-1");
    expect(input).toHaveClass("w-full");
    expect(input).toHaveClass("border");
  });

  test("does not produce fused style tokens", () => {
    render(<Input aria-label="Search" />);

    const input = screen.getByRole("textbox", { name: "Search" });

    expect(input.className).not.toMatch(/\)\[box-shadow/);
    expect(input.className).not.toContain("focus:border-(--accent)focus:");
    expect(input.className).not.toContain("alloweddisabled");
    expect(input).toHaveClass("border-(--border-input)");
    expect(input).toHaveClass("disabled:opacity-85");
  });
});

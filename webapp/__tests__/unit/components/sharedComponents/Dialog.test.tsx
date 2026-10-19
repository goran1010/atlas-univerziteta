import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "../../../../src/components/sharedComponents/Dialog";

function renderDialog({
  open = true,
  onClose = vi.fn(),
}: { open?: boolean; onClose?: () => void } = {}) {
  render(
    <Dialog
      open={open}
      onClose={onClose}
      title="Dialog title"
      footer={<p>Footer</p>}
    >
      <p>Dialog body</p>
    </Dialog>,
  );
  return { onClose, user: userEvent.setup() };
}

describe("Dialog", () => {
  test("renders nothing while closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByText("Dialog title")).not.toBeInTheDocument();
  });

  test("shows the title, body and footer when open", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Dialog title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  test("calls onClose from the close button", async () => {
    const { onClose, user } = renderDialog();

    await user.click(screen.getByRole("button", { name: /Close/i }));

    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose when the backdrop is clicked", async () => {
    const { onClose, user } = renderDialog();

    await user.click(screen.getByRole("dialog"));

    expect(onClose).toHaveBeenCalled();
  });

  test("does not close from clicks inside the content", async () => {
    const { onClose, user } = renderDialog();

    await user.click(screen.getByText("Dialog body"));

    expect(onClose).not.toHaveBeenCalled();
  });
});

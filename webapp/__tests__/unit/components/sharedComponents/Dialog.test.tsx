import { useState } from "react";
import { screen } from "@testing-library/react";
import { Dialog } from "../../../../src/components/sharedComponents/Dialog";
import { renderWithProviders } from "../../../utils/renderWithProviders";

function renderDialog({
  open = true,
  onClose = vi.fn(),
}: { open?: boolean; onClose?: () => void } = {}) {
  const { user } = renderWithProviders(
    <Dialog
      open={open}
      onClose={onClose}
      title="Dialog title"
      footer={<p>Footer</p>}
    >
      <p>Dialog body</p>
    </Dialog>,
  );
  return { onClose, user };
}

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open dialog
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Dialog title"
      >
        <p>Dialog body</p>
      </Dialog>
    </>
  );
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

  test("labels the dialog with its title", () => {
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: "Dialog title" }),
    ).toBeInTheDocument();
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

  test("returns focus to the opener after closing", async () => {
    const { user } = renderWithProviders(<DialogHarness />);
    const opener = screen.getByRole("button", { name: "Open dialog" });

    await user.click(opener);
    await user.click(screen.getByRole("button", { name: /Close/i }));

    expect(screen.queryByText("Dialog body")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});

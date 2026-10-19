import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "../../../../src/components/Home/ShareButton";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

const writeTextMock = vi.fn();

function renderShareButton() {
  render(
    <RootContextProvider>
      <Notifications />
      <ShareButton url="/universities/1" />
    </RootContextProvider>,
  );
  const user = userEvent.setup();
  // after userEvent.setup(), which installs its own clipboard stub
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    configurable: true,
  });
  return user;
}

beforeEach(() => {
  writeTextMock.mockReset();
});

describe("ShareButton", () => {
  test("copies the full link and shows a success notification", async () => {
    writeTextMock.mockResolvedValue(undefined);
    const user = renderShareButton();

    await user.click(screen.getByRole("button", { name: /share/i }));

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("/universities/1"),
    );
    expect(
      await screen.findByText(/Link copied to clipboard\./i),
    ).toBeInTheDocument();
  });

  test("shows an error notification when copying fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    const user = renderShareButton();

    await user.click(screen.getByRole("button", { name: /share/i }));

    expect(
      await screen.findByText(/Could not copy link\./i),
    ).toBeInTheDocument();
  });
});

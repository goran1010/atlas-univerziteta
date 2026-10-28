import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { ResetPassword } from "../../../../src/components/ResetPassword/ResetPassword";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

const resetPasswordMock = vi.fn();

vi.mock("../../../../src/utils/authClient", () => ({
  authClient: {
    resetPassword: (...args: unknown[]): unknown => resetPasswordMock(...args),
  },
}));

const user = userEvent.setup();

function renderResetPassword(initialEntry: string) {
  render(
    <RootContextProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Notifications />
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/forgot-password" element={<div>Forgot Page</div>} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    </RootContextProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function submitPasswords(password: string, confirm = password) {
  await user.type(screen.getByLabelText(/^Password/), password);
  await user.type(screen.getByLabelText(/Confirm password/i), confirm);
  await user.click(screen.getByRole("button", { name: /Reset password/i }));
}

describe("ResetPassword without a usable token", () => {
  test("shows the invalid-link state when the token is missing", () => {
    renderResetPassword("/reset-password");

    expect(
      screen.getByRole("heading", { name: /not valid/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Request a new link/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  test("shows the invalid-link state when the server redirected with an error", () => {
    renderResetPassword("/reset-password?error=INVALID_TOKEN");

    expect(
      screen.getByRole("heading", { name: /not valid/i }),
    ).toBeInTheDocument();
  });
});

describe("ResetPassword form validation", () => {
  test("applies the signup password rules and the match check", async () => {
    renderResetPassword("/reset-password?token=token-123");
    const passwordField = screen.getByLabelText<HTMLInputElement>(/^Password/);
    const confirmField =
      screen.getByLabelText<HTMLInputElement>(/Confirm password/i);

    await user.type(passwordField, "abc12");
    expect(passwordField.validationMessage).toMatch(/at least 8 characters/i);

    await user.clear(passwordField);
    await user.type(passwordField, "Password123");
    expect(passwordField.validationMessage).toBe("");

    await user.type(confirmField, "Different123");
    expect(confirmField.validationMessage).toMatch(/must match/i);
  });
});

describe("ResetPassword submit", () => {
  test("resets the password and navigates to login", async () => {
    resetPasswordMock.mockResolvedValue({
      data: { status: true },
      error: null,
    });
    renderResetPassword("/reset-password?token=token-123");

    await submitPasswords("Password123");

    expect(resetPasswordMock).toHaveBeenCalledWith({
      newPassword: "Password123",
      token: "token-123",
    });
    expect(await screen.findByText(/Login Page/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Your password has been reset/i),
    ).toBeInTheDocument();
  });

  test("switches to the invalid-link state when the token is rejected", async () => {
    resetPasswordMock.mockResolvedValue({
      data: null,
      error: { code: "INVALID_TOKEN", message: "invalid token" },
    });
    renderResetPassword("/reset-password?token=token-123");

    await submitPasswords("Password123");

    expect(
      await screen.findByRole("heading", { name: /not valid/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Request a new link/i }),
    ).toBeInTheDocument();
  });

  test("shows an error for a non-token server rejection", async () => {
    resetPasswordMock.mockResolvedValue({
      data: null,
      error: { code: "PASSWORD_TOO_SHORT", message: "too short" },
    });
    renderResetPassword("/reset-password?token=token-123");

    await submitPasswords("Password123");

    expect(
      await screen.findByText(/Password reset failed/i),
    ).toBeInTheDocument();
  });

  test("shows an error when the request throws", async () => {
    resetPasswordMock.mockRejectedValue(new Error("Network error"));
    renderResetPassword("/reset-password?token=token-123");

    await submitPasswords("Password123");

    expect(
      await screen.findByText(/Something went wrong resetting/i),
    ).toBeInTheDocument();
  });
});

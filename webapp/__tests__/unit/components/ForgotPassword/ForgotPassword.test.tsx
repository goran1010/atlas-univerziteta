import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { ForgotPassword } from "../../../../src/components/ForgotPassword/ForgotPassword";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

const requestPasswordResetMock = vi.fn();

vi.mock("../../../../src/utils/authClient", () => ({
  authClient: {
    requestPasswordReset: (...args: unknown[]): unknown =>
      requestPasswordResetMock(...args),
  },
}));

const user = userEvent.setup();

beforeEach(() => {
  vi.clearAllMocks();

  render(
    <RootContextProvider>
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Notifications />
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    </RootContextProvider>,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function submitEmail(email: string) {
  await user.type(screen.getByLabelText(/Email/i), email);
  await user.click(screen.getByRole("button", { name: /Send reset link/i }));
}

describe("ForgotPassword rendering and validation", () => {
  test("renders the heading, description and a back-to-login link", () => {
    expect(
      screen.getByRole("heading", { name: /Reset your password/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Enter your account email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Log In/i }),
    ).toHaveAttribute("href", "/login");
  });

  test("flags an invalid email while typing", async () => {
    const emailField = screen.getByLabelText<HTMLInputElement>(/Email/i);

    await user.type(emailField, "not_an_email");
    expect(emailField.validationMessage).toMatch(/valid email/i);

    await user.clear(emailField);
    await user.type(emailField, "test@mail.com");
    expect(emailField.validationMessage).toBe("");
  });
});

describe("ForgotPassword submit", () => {
  test("requests a reset link and shows the sent confirmation", async () => {
    requestPasswordResetMock.mockResolvedValue({
      data: { status: true },
      error: null,
    });

    await submitEmail("someone@mail.com");

    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: "someone@mail.com",
      redirectTo: `${window.location.origin}/reset-password`,
    });
    expect(
      await screen.findByText(/a password reset link is on its way/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Send reset link/i }),
    ).not.toBeInTheDocument();
  });

  test("shows an error and keeps the form when the server rejects", async () => {
    requestPasswordResetMock.mockResolvedValue({
      data: null,
      error: { message: "nope" },
    });

    await submitEmail("someone@mail.com");

    expect(
      await screen.findByText(/Could not send the reset link/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send reset link/i }),
    ).toBeInTheDocument();
  });

  test("shows an error when the request throws", async () => {
    requestPasswordResetMock.mockRejectedValue(new Error("Network error"));

    await submitEmail("someone@mail.com");

    expect(
      await screen.findByText(/Something went wrong requesting/i),
    ).toBeInTheDocument();
  });
});

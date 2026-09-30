import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { LogIn } from "../../../../src/components/LogIn/LogIn";
import { About } from "../../../../src/components/About/About";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

const signInEmailMock = vi.fn();
const signInSocialMock = vi.fn();

vi.mock("../../../../src/utils/authClient", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmailMock(...args),
      social: (...args: unknown[]) => signInSocialMock(...args),
    },
  },
}));

const user = userEvent.setup();

interface FormElements {
  emailField: HTMLInputElement;
  passwordField: HTMLInputElement;
  logInButton: HTMLButtonElement;
}

function createFormElements(): FormElements {
  return {
    emailField: screen.getByLabelText(/Email/i),
    passwordField: screen.getByLabelText(/^Password/),
    logInButton: screen.getByRole("button", { name: "Log in" }),
  };
}

async function submitLogInForm({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { emailField, passwordField, logInButton } = createFormElements();

  await user.type(emailField, email);
  await user.type(passwordField, password);
  await user.click(logInButton);
}

beforeEach(() => {
  vi.clearAllMocks();

  function Wrapper() {
    return (
      <RootContextProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Notifications />
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/home" element={<About />} />
            <Route path="/login" element={<LogIn />} />
          </Routes>
        </MemoryRouter>
      </RootContextProvider>
    );
  }

  render(<Wrapper />);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Render LogIn Component", () => {
  test("LogIn component heading", () => {
    const linkElement = screen.getByRole("heading", {
      name: /Log in/i,
    });
    expect(linkElement).toBeInTheDocument();
  });

  test("LogIn form fields", () => {
    const { emailField, passwordField, logInButton } = createFormElements();
    expect(emailField).toBeInTheDocument();
    expect(passwordField).toBeInTheDocument();
    expect(logInButton).toBeInTheDocument();
  });

  test("shows oauth error notification from query params", async () => {
    function WrapperWithError() {
      return (
        <RootContextProvider>
          <MemoryRouter initialEntries={["/login?error=something"]}>
            <Notifications />
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/login" element={<LogIn />} />
            </Routes>
          </MemoryRouter>
        </RootContextProvider>
      );
    }

    render(<WrapperWithError />);

    const oauthFailed = await screen.findByText(/Login failed/i);

    expect(oauthFailed).toBeInTheDocument();
  });

  test("redirects to home and warns when user is already logged in", async () => {
    function WrapperWithUser() {
      return (
        <RootContextProvider
          initialUserData={{ id: "test-id", name: "test", email: "user@mail.com", emailVerified: true, createdAt: new Date(), updatedAt: new Date(), role: "USER" }}
        >
          <MemoryRouter initialEntries={["/login"]}>
            <Notifications />
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/home" element={<About />} />
              <Route path="/login" element={<LogIn />} />
            </Routes>
          </MemoryRouter>
        </RootContextProvider>
      );
    }

    render(<WrapperWithUser />);

    const alreadyLoggedIn = await screen.findByText(/already logged in/i);
    const homePageText = await screen.findByText(
      /A free, open-source project/i,
    );

    expect(alreadyLoggedIn).toBeInTheDocument();
    expect(homePageText).toBeInTheDocument();
  });
});

describe("GitHub login", () => {
  test("starts loading when the GitHub login button is clicked", async () => {
    signInSocialMock.mockReturnValue(new Promise(() => {}));
    const githubLoginButton = screen.getByRole("button", {
      name: "Continue with GitHub",
    });

    await user.click(githubLoginButton);

    expect(githubLoginButton).toBeDisabled();
    expect(
      within(githubLoginButton).getByRole("status", { name: /Loading/i }),
    ).toBeInTheDocument();
  });

  test("prevents a repeated GitHub login click while loading", async () => {
    signInSocialMock.mockReturnValue(new Promise(() => {}));
    const githubLoginButton = screen.getByRole("button", {
      name: "Continue with GitHub",
    });

    await user.click(githubLoginButton);

    const wasPrevented = !fireEvent.click(githubLoginButton);

    expect(wasPrevented).toBe(false);
    expect(githubLoginButton).toBeDisabled();
  });
});

describe("User typing in input fields in LogIn Component", () => {
  test("displays user input", async () => {
    const { passwordField, emailField } = createFormElements();

    await user.type(emailField, "testuser@example.com");
    await user.type(passwordField, "Password123");

    expect(emailField).toHaveValue("testuser@example.com");
    expect(passwordField).toHaveValue("Password123");
  });
});

describe("LogIn form validation on input", () => {
  test("shows validation messages for invalid email", async () => {
    const { emailField } = createFormElements();

    await user.type(emailField, "not_an_email");
    expect(emailField).toHaveValue("not_an_email");
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.clear(emailField);
    await user.type(emailField, "test@mail.com");
    expect(emailField).toHaveValue("test@mail.com");
    expect(emailField.validationMessage).toBe("");
  });
  test("shows validation messages for invalid password", async () => {
    const { passwordField } = createFormElements();

    await user.type(passwordField, "pass");
    expect(passwordField).toHaveValue("pass");
    expect(passwordField.validationMessage).toBe("");
    await user.clear(passwordField);
    expect(passwordField.validationMessage).toMatch(/password is required/i);
  });
});

describe("LogIn for validation on button click", () => {
  test("shows validation messages for invalid email input", async () => {
    const { logInButton, emailField } = createFormElements();

    await user.type(emailField, "not_an_email");
    await user.click(logInButton);

    expect(emailField).toHaveValue("not_an_email");
    expect(emailField.validationMessage).toMatch(/valid email/i);

    await user.clear(emailField);
    await user.type(emailField, "test@mail.com");
    await user.click(logInButton);

    expect(emailField).toHaveValue("test@mail.com");
    expect(emailField.validationMessage).toBe("");
  });

  test("shows validation messages for invalid password input", async () => {
    const { logInButton, passwordField } = createFormElements();

    await user.type(passwordField, "pass");
    await user.click(logInButton);

    expect(passwordField).toHaveValue("pass");
    expect(passwordField.validationMessage).toBe("");

    await user.clear(passwordField);
    await user.click(logInButton);
    expect(passwordField.validationMessage).toMatch(/password is required/i);
  });
});

describe("LogIn Form Submit", () => {
  test("shows a translated error after submitting with wrong credentials", async () => {
    signInEmailMock.mockResolvedValue({
      data: null,
      error: { message: "Invalid credentials" },
    });

    await submitLogInForm({
      email: "existing@user.com",
      password: "Password123",
    });

    const errorMessage = await screen.findByText(
      /^Login failed\. Check your email and password, then try again\.$/i,
    );

    expect(signInEmailMock).toHaveBeenCalledTimes(1);
    expect(errorMessage).toBeInTheDocument();
  });

  test("Redirects to Home on successful form submit", async () => {
    signInEmailMock.mockResolvedValue({
      data: {
        user: { id: "test-id", name: "test", email: "new@user.com", emailVerified: true, role: "USER", createdAt: new Date(), updatedAt: new Date() },
      },
      error: null,
    });

    await submitLogInForm({ email: "new@user.com", password: "Password123" });

    const homePageText = await screen.findByText(
      /Universities and Study Programs in Bosnia and Herzegovina/i,
    );
    expect(homePageText).toBeInTheDocument();
  });

  test("shows error message when signIn throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());

    signInEmailMock.mockRejectedValue(new Error("Network error"));

    await submitLogInForm({
      email: "existing@user.com",
      password: "Password123",
    });

    const networkErrorMessage = await screen.findByText(
      /Something went wrong during login/i,
    );
    expect(networkErrorMessage).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { LogIn } from "../../../../src/components/LogIn/LogIn";
import { About } from "../../../../src/components/About/About";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";

vi.mock("../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../../src/utils/getCsrfToken")>();
  return {
    ...actual,
    getCsrfToken: () => Promise.resolve("mocked-csrf-token"),
    clearCsrfToken: vi.fn(),
  };
});

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

  test("shows github login error notification from query params", async () => {
    function WrapperWithGithubError() {
      return (
        <RootContextProvider>
          <MemoryRouter initialEntries={["/login?error=github"]}>
            <Notifications />
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/login" element={<LogIn />} />
            </Routes>
          </MemoryRouter>
        </RootContextProvider>
      );
    }

    render(<WrapperWithGithubError />);

    const githubFailed = await screen.findByText(/GitHub login failed/i);

    expect(githubFailed).toBeInTheDocument();
  });

  test("redirects to home and warns when user is already logged in", async () => {
    function WrapperWithUser() {
      return (
        <RootContextProvider
          initialUserData={{ email: "user@mail.com", role: "USER" }}
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
  test("starts loading when the GitHub login link is clicked", async () => {
    const githubLoginLink = screen.getByRole("link", {
      name: "Continue with GitHub",
    });
    githubLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
    });

    await user.click(githubLoginLink);

    expect(githubLoginLink).toHaveAttribute("aria-disabled", "true");
    expect(
      within(githubLoginLink).getByRole("status", { name: /Loading/i }),
    ).toBeInTheDocument();
  });

  test("prevents a repeated GitHub login click while loading", async () => {
    const githubLoginLink = screen.getByRole("link", {
      name: "Continue with GitHub",
    });
    githubLoginLink.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
      },
      { once: true },
    );
    await user.click(githubLoginLink);

    const wasPrevented = !fireEvent.click(githubLoginLink);

    expect(wasPrevented).toBe(true);
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
  test("shows a translated error after submitting wrong email or password", async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({
        error: {
          message:
            "Login failed: Invalid email or password. Check your credentials and try again.",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockErrorResponse);

    await submitLogInForm({
      email: "existing@user.com",
      password: "Password123",
    });

    const errorMessage = await screen.findByText(/^Login failed\.$/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(errorMessage).toBeInTheDocument();
  });

  test("Redirects to Home on successful form submit", async () => {
    const mockedResponse = new Response(
      JSON.stringify({
        message: "Logged in successfully",
        data: { email: "new@user.com", role: "USER" },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockedResponse);

    await submitLogInForm({ email: "new@user.com", password: "Password123" });

    const homePageText = await screen.findByText(
      /Universities and Study Programs in Bosnia and Herzegovina/i,
    );
    expect(homePageText).toBeInTheDocument();
  });

  test("shows a translated error when a successful response is malformed", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Logged in successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await submitLogInForm({
      email: "new@user.com",
      password: "Password123",
    });

    expect(
      await screen.findByText(/^An error occurred while logging in\.$/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Universities and Study Programs/i),
    ).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("shows error message when network request throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );

    await submitLogInForm({
      email: "existing@user.com",
      password: "Password123",
    });

    const networkErrorMessage = await screen.findByText(
      /An error occurred while logging in/i,
    );
    expect(networkErrorMessage).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test("shows fallback login failed message when backend error payload is missing", async () => {
    const mockedResponse = new Response(JSON.stringify({}), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockedResponse);

    await submitLogInForm({
      email: "existing@user.com",
      password: "Password123",
    });

    const fallbackError = await screen.findByText(/^Login failed\.$/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fallbackError).toBeInTheDocument();
  });
});

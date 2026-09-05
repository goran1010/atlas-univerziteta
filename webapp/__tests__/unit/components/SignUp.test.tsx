import { SignUp } from "../../../src/components/SignUp/SignUp";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { LogIn } from "../../../src/components/LogIn/LogIn";
import { Notifications } from "../../../src/components/Notifications";
import { RootContextProvider } from "../../utils/rootContextProvider";

vi.mock("../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/utils/getCsrfToken")>();
  return {
    ...actual,
    getCsrfToken: () => Promise.resolve("mocked-csrf-token"),
    clearCsrfToken: vi.fn(),
  };
});

const user = userEvent.setup();

type Element =
  "emailField" | "passwordField" | "confirmPasswordField" | "signUpButton";

beforeEach(() => {
  function Wrapper() {
    return (
      <RootContextProvider>
        <MemoryRouter initialEntries={["/signup"]}>
          <Notifications />
          <Routes>
            <Route path="/signup" element={<SignUp />} />
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

function createFormElements() {
  return {
    emailField: screen.getByLabelText<HTMLInputElement>(/Email/i),
    passwordField: screen.getByLabelText<HTMLInputElement>(/^Password/),
    confirmPasswordField:
      screen.getByLabelText<HTMLInputElement>(/Confirm Password/i),
    signUpButton: screen.getByRole<HTMLButtonElement>("button", {
      name: /Create/i,
    }),
  };
}

async function submitSignUpForm({
  email,
  password,
  confirmPassword,
  button,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  button?: HTMLElement;
}) {
  const { emailField, passwordField, confirmPasswordField, signUpButton } =
    createFormElements();

  await user.type(emailField, email);
  await user.type(passwordField, password);
  await user.type(confirmPasswordField, confirmPassword);
  await user.click(button ?? signUpButton);
}

describe("Render SignUp Component", () => {
  test("SignUp component heading", () => {
    const linkElement = screen.getByRole("heading", {
      name: /Create your account/i,
    });
    expect(linkElement).toBeInTheDocument();
  });

  test("SignUp form fields", () => {
    const formElements = createFormElements();
    let element: Element;
    for (element in formElements) {
      expect(formElements[element]).toBeInTheDocument();
    }
  });

  test("redirects to home and warns when user is already logged in", async () => {
    function WrapperWithUser() {
      return (
        <RootContextProvider
          initialUserData={{ email: "user@mail.com", role: "USER" }}
        >
          <MemoryRouter initialEntries={["/signup"]}>
            <Notifications />
            <Routes>
              <Route path="/" element={<div>Home Page</div>} />
              <Route path="/home" element={<div>Home Page</div>} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LogIn />} />
            </Routes>
          </MemoryRouter>
        </RootContextProvider>
      );
    }

    render(<WrapperWithUser />);

    const warningMessage = await screen.findByText(
      /can't sign up while logged in/i,
    );
    const homePageText = await screen.findByText(/^Home Page$/i);

    expect(warningMessage).toBeInTheDocument();
    expect(homePageText).toBeInTheDocument();
  });
});

describe("User typing in input fields in SignUp Component", () => {
  test("displays user input", async () => {
    const { passwordField, confirmPasswordField, emailField } =
      createFormElements();

    await user.type(emailField, "testuser@example.com");
    await user.type(passwordField, "Password123");
    await user.type(confirmPasswordField, "Password123");

    expect(emailField).toHaveValue("testuser@example.com");
    expect(passwordField).toHaveValue("Password123");
    expect(confirmPasswordField).toHaveValue("Password123");
  });
});

describe("SignUp Form Validation on input", () => {
  test("shows validation messages for email input", async () => {
    const { emailField }: { emailField: HTMLInputElement } =
      createFormElements();

    await user.type(emailField, "te");
    expect(emailField).toHaveValue("te");
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.type(emailField, "st");
    expect(emailField).toHaveValue("test");
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.type(emailField, "@");
    expect(emailField).toHaveValue("test@");
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.type(emailField, "mail.com");
    expect(emailField).toHaveValue("test@mail.com");
    expect(emailField.validationMessage).toBe("");
  });

  test("shows validation messages for password input", async () => {
    const { passwordField } = createFormElements();

    await user.type(passwordField, "pass");
    expect(passwordField).toHaveValue("pass");
    expect(passwordField.validationMessage).toMatch(/at least 6 characters/i);
    await user.type(passwordField, "word");
    expect(passwordField).toHaveValue("password");
    expect(passwordField.validationMessage).toMatch(/at least one number/i);
    await user.type(passwordField, "1");
    expect(passwordField.validationMessage).toBe("");

    await user.clear(passwordField);
    await user.type(passwordField, "Password!");
    expect(passwordField.validationMessage).toMatch(/only contain/i);
  });

  test("shows validation messages for confirm password input", async () => {
    const { passwordField, confirmPasswordField } = createFormElements();

    await user.type(passwordField, "password");
    expect(passwordField).toHaveValue("password");

    await user.type(confirmPasswordField, "different");
    expect(confirmPasswordField).toHaveValue("different");
    expect(confirmPasswordField.validationMessage).toMatch(/must match/i);
    await user.clear(confirmPasswordField);
    await user.type(confirmPasswordField, "password");
    expect(confirmPasswordField).toHaveValue("password");
    expect(confirmPasswordField.validationMessage).toBe("");
  });
});

describe("SignUp Form Validation on Create button click", () => {
  test("shows validation messages for invalid input on Create button click", async () => {
    const { signUpButton, emailField } = createFormElements();

    await user.type(emailField, "te");
    expect(emailField).toHaveValue("te");
    await user.click(signUpButton);
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.type(emailField, "st");
    expect(emailField).toHaveValue("test");
    await user.click(signUpButton);
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.type(emailField, "@");
    expect(emailField).toHaveValue("test@");
    await user.click(signUpButton);
    expect(emailField.validationMessage).toMatch(/valid email/i);
    await user.type(emailField, "mail.com");
    expect(emailField).toHaveValue("test@mail.com");
    await user.click(signUpButton);
    expect(emailField.validationMessage).toBe("");
  });

  test("shows validation messages for password input", async () => {
    const { passwordField, signUpButton } = createFormElements();

    await user.type(passwordField, "pass");
    expect(passwordField).toHaveValue("pass");
    await user.click(signUpButton);
    expect(passwordField.validationMessage).toMatch(/at least 6 characters/i);
    await user.type(passwordField, "word");
    expect(passwordField).toHaveValue("password");
    await user.click(signUpButton);
    expect(passwordField.validationMessage).toMatch(/at least one number/i);
    await user.type(passwordField, "1");
    await user.click(signUpButton);
    expect(passwordField.validationMessage).toBe("");
  });

  test("shows validation messages for confirm password input", async () => {
    const { passwordField, confirmPasswordField, signUpButton } =
      createFormElements();

    await user.type(passwordField, "password");
    expect(passwordField).toHaveValue("password");

    await user.type(confirmPasswordField, "different");
    expect(confirmPasswordField).toHaveValue("different");
    await user.click(signUpButton);
    expect(confirmPasswordField.validationMessage).toMatch(/must match/i);
    await user.clear(confirmPasswordField);
    await user.type(confirmPasswordField, "password");
    expect(confirmPasswordField).toHaveValue("password");
    await user.click(signUpButton);
    expect(confirmPasswordField.validationMessage).toBe("");
  });
});

describe("SignUp Form Submit", () => {
  test("shows a translated error after clicking Create with an existing email", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    const mockResponse = new Response(
      JSON.stringify({
        error: {
          message:
            "Validation failed: Email already in use Fix the highlighted fields and try again.",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);
    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    const registrationFailedMessage = await screen.findByText(
      /Registration failed\./i,
    );
    expect(registrationFailedMessage).toBeInTheDocument();
  });

  test("Redirects to LogIn on successful form submit", async () => {
    const mockResponse = new Response(
      JSON.stringify({
        message: "Registration successful! Check your email.",
        data: { email: "newemail@mail.com" },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const logInButton = await screen.findByRole("button", { name: /Log In/i });
    expect(logInButton).toBeInTheDocument();

    const successMessage = await screen.findByText(
      /Registration successful! Check your email./i,
    );
    expect(successMessage).toBeInTheDocument();
  });

  test("shows a translated error when a successful response is malformed", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Registration successful." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(
      await screen.findByText(/^An error occurred during registration\.$/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Log In/i }),
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

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const networkErrorMessage = await screen.findByText(
      /An error occurred during registration/i,
    );
    expect(networkErrorMessage).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test("shows fallback registration failed message when backend error payload is missing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    const mockResponse = new Response(null, {
      status: 400,
      statusText: "Bad Request",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse);

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const fallbackError = await screen.findByText("Registration failed.");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fallbackError).toBeInTheDocument();
  });
});

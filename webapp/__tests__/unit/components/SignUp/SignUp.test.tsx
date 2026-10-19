import { SignUp } from "../../../../src/components/SignUp/SignUp";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { LogIn } from "../../../../src/components/LogIn/LogIn";
import { Notifications } from "../../../../src/components/Notifications";
import { RootContextProvider } from "../../../utils/rootContextProvider";
import { makeUser } from "../../../utils/makeUser";

const signUpEmailMock = vi.fn();

vi.mock("../../../../src/utils/authClient", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]): unknown => signUpEmailMock(...args),
    },
    signIn: {
      social: vi.fn().mockReturnValue(new Promise(() => undefined)),
    },
  },
}));

const user = userEvent.setup();

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

  test("redirects to home and warns when user is already logged in", async () => {
    function WrapperWithUser() {
      return (
        <RootContextProvider initialUserData={makeUser()}>
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

describe("SignUp Form Validation", () => {
  // each case asserts the message both while typing and after a Create click
  const validationCases = [
    { field: "email", value: "te", message: /valid email/i },
    { field: "email", value: "test", message: /valid email/i },
    { field: "email", value: "test@", message: /valid email/i },
    { field: "email", value: "test@mail.com", message: "" },
    { field: "password", value: "pass", message: /at least 6 characters/i },
    { field: "password", value: "password", message: /at least one number/i },
    { field: "password", value: "Password!", message: /only contain/i },
    { field: "password", value: "password1", message: "" },
  ] as const;

  test.each(validationCases)(
    "$field input $value shows the right validation message",
    async ({ field, value, message }) => {
      const { emailField, passwordField, signUpButton } = createFormElements();
      const input = field === "email" ? emailField : passwordField;

      await user.type(input, value);
      expect(input).toHaveValue(value);

      if (message === "") {
        expect(input.validationMessage).toBe("");
      } else {
        expect(input.validationMessage).toMatch(message);
      }

      await user.click(signUpButton);

      if (message === "") {
        expect(input.validationMessage).toBe("");
      } else {
        expect(input.validationMessage).toMatch(message);
      }
    },
  );

  test("requires confirm password to match the password", async () => {
    const { passwordField, confirmPasswordField, signUpButton } =
      createFormElements();

    await user.type(passwordField, "password");
    await user.type(confirmPasswordField, "different");
    expect(confirmPasswordField.validationMessage).toMatch(/must match/i);

    await user.click(signUpButton);
    expect(confirmPasswordField.validationMessage).toMatch(/must match/i);

    await user.clear(confirmPasswordField);
    await user.type(confirmPasswordField, "password");
    expect(confirmPasswordField.validationMessage).toBe("");
  });
});

describe("SignUp Form Submit", () => {
  test("shows a translated error after clicking Create with an existing email", async () => {
    signUpEmailMock.mockResolvedValue({
      data: null,
      error: { message: "Email already in use" },
    });

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(signUpEmailMock).toHaveBeenCalledTimes(1);

    const registrationFailedMessage = await screen.findByText(
      /Registration failed\. Check your details, then try again\./i,
    );
    expect(registrationFailedMessage).toBeInTheDocument();
  });

  test("Redirects to LogIn on successful form submit", async () => {
    signUpEmailMock.mockResolvedValue({
      data: { user: { email: "newemail@mail.com" } },
      error: null,
    });

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const successMessage = await screen.findByText(/Registration successful/i);
    expect(successMessage).toBeInTheDocument();
  });

  test("shows error message when signUp throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());

    signUpEmailMock.mockRejectedValue(new Error("Network error"));

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const networkErrorMessage = await screen.findByText(
      /Something went wrong during registration/i,
    );
    expect(networkErrorMessage).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test("shows fallback registration failed message when backend returns error", async () => {
    signUpEmailMock.mockResolvedValue({
      data: null,
      error: { message: "Bad Request" },
    });

    await submitSignUpForm({
      email: "newemail@mail.com",
      password: "Password123",
      confirmPassword: "Password123",
    });

    const fallbackError = await screen.findByText(
      "Registration failed. Check your details, then try again.",
    );

    expect(signUpEmailMock).toHaveBeenCalled();
    expect(fallbackError).toBeInTheDocument();
  });
});

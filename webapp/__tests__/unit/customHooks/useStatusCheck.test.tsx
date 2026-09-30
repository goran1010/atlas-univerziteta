import { act, render, screen } from "@testing-library/react";
import { useStatusCheck } from "../../../src/customHooks/useStatusCheck";

import type { Notification } from "../../../src/types";

const getSessionMock = vi.fn();

vi.mock("../../../src/utils/authClient", () => ({
  authClient: {
    getSession: (...args: unknown[]): unknown => getSessionMock(...args),
  },
}));

const identityTranslate = (key: string) => key;

interface StatusCheckProbeProps {
  addNotification: (notification: Notification) => string;
}

function StatusCheckProbe({ addNotification }: StatusCheckProbeProps) {
  const { userData } = useStatusCheck(addNotification, identityTranslate);

  return <div data-testid="user-email">{userData?.email ?? "none"}</div>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useStatusCheck", () => {
  test("sets user data without notifying on a successful session check", async () => {
    const addNotification = vi.fn(() => "notification-id");
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: "test-id",
          name: "test",
          email: "user@example.com",
          emailVerified: true,
          role: "USER",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      error: null,
    });

    render(<StatusCheckProbe addNotification={addNotification} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "user@example.com",
    );
    expect(addNotification).not.toHaveBeenCalled();
  });

  test("does not notify when no session exists", async () => {
    const addNotification = vi.fn(() => "notification-id");
    getSessionMock.mockResolvedValue({
      data: null,
      error: null,
    });

    render(<StatusCheckProbe addNotification={addNotification} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(addNotification).not.toHaveBeenCalled();
    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
  });

  test("does not notify after unmounting while a session check is pending", async () => {
    const addNotification = vi.fn(() => "notification-id");
    let resolveSession!: (value: unknown) => void;
    getSessionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSession = resolve;
        }),
    );

    const { unmount } = render(
      <StatusCheckProbe addNotification={addNotification} />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    unmount();

    resolveSession({
      data: {
        user: {
          id: "test-id",
          name: "test",
          email: "user@example.com",
          emailVerified: true,
          role: "USER",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      error: null,
    });

    expect(addNotification).not.toHaveBeenCalled();
  });

  test("reports an error when getSession throws", async () => {
    const addNotification = vi.fn(() => "notification-id");
    getSessionMock.mockRejectedValue(new Error("Network error"));

    render(<StatusCheckProbe addNotification={addNotification} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.loginStatus.error",
    });
    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
  });
});

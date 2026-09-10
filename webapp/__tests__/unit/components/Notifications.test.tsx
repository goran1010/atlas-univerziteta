import { act, fireEvent, render, screen } from "@testing-library/react";
import { Notifications } from "../../../src/components/Notifications";
import { RootContext } from "../../../src/contextData/RootContext";

import type {
  Notification,
  TypeNotification,
} from "../../../src/types/notification";
import type { RootContextType } from "../../../src/contextData/RootContext";

interface WrapperProps {
  notifications: Notification[];
  removeNotification?: RootContextType["removeNotification"];
}

function createContextValue({
  notifications,
  removeNotification = vi.fn(),
}: WrapperProps): RootContextType {
  return {
    language: "en",
    setLanguage: vi.fn(),
    t: (key) => key,
    notifications,
    addNotification: vi.fn(),
    removeNotification,
    userData: null,
    setUserData: vi.fn(),
    serverStatus: "live",
  };
}

function Wrapper(props: WrapperProps) {
  return (
    <RootContext value={createContextValue(props)}>
      <Notifications />
    </RootContext>
  );
}

function createNotification(type: TypeNotification): Notification {
  return {
    id: `${type}-id`,
    type,
    message: `${type} message`,
    duration: null,
    persistent: true,
  };
}

const notificationCases: [TypeNotification, "status" | "alert", string][] = [
  ["success", "status", "border-l-green-600"],
  ["error", "alert", "border-l-red-600"],
  ["warning", "alert", "border-l-amber-500"],
  ["info", "status", "border-l-sky-600"],
];

describe("Notifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("renders nothing when there are no notifications", () => {
    render(<Wrapper notifications={[]} />);

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  test.each(notificationCases)(
    "renders a %s notification with the correct role and style",
    (type, role, styleClass) => {
      render(<Wrapper notifications={[createNotification(type)]} />);

      const notification = screen.getByRole(role);

      expect(notification).toHaveTextContent(`${type} message`);
      expect(notification).toHaveClass(styleClass);
      expect(screen.getByRole("complementary")).toHaveAttribute(
        "aria-label",
        "notifications.title",
      );
    },
  );

  test("removes a notification when its dismiss button is clicked", () => {
    const removeNotification = vi.fn();
    render(
      <Wrapper
        notifications={[createNotification("info")]}
        removeNotification={removeNotification}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "notifications.dismiss" }),
    );

    expect(removeNotification).toHaveBeenCalledWith("info-id");
  });

  test("removes an auto-dismissible notification after its duration", async () => {
    const removeNotification = vi.fn();
    render(
      <Wrapper
        notifications={[
          {
            id: "temporary-id",
            type: "info",
            message: "Temporary message",
            duration: 1000,
            persistent: false,
          },
        ]}
        removeNotification={removeNotification}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(removeNotification).toHaveBeenCalledWith("temporary-id");
  });

  test("cancels an existing timer when a notification becomes persistent", async () => {
    const removeNotification = vi.fn();
    const notification: Notification = {
      id: "temporary-id",
      type: "info",
      message: "Temporary message",
      duration: 1000,
      persistent: false,
    };
    const { rerender } = render(
      <Wrapper
        notifications={[notification]}
        removeNotification={removeNotification}
      />,
    );

    rerender(
      <Wrapper
        notifications={[{ ...notification, duration: null, persistent: true }]}
        removeNotification={removeNotification}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(removeNotification).not.toHaveBeenCalled();
  });

  test("cleans up a timer for a notification removed before unmount", async () => {
    const removeNotification = vi.fn();
    const { rerender, unmount } = render(
      <Wrapper
        notifications={[
          {
            id: "temporary-id",
            type: "info",
            message: "Temporary message",
            duration: 1000,
            persistent: false,
          },
        ]}
        removeNotification={removeNotification}
      />,
    );

    rerender(
      <Wrapper notifications={[]} removeNotification={removeNotification} />,
    );
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(removeNotification).not.toHaveBeenCalled();
  });
});

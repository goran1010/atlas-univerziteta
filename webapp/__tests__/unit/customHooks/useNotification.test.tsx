import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNotification } from "../../../src/customHooks/useNotification";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
    return `123-123-123-123-${Math.random().toString(36).slice(2, 8)}`;
  });
});

function NotificationProbe() {
  const { notifications, addNotification, removeNotification } =
    useNotification();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          addNotification({
            type: "success",
            message: "Created",
            duration: 1000,
          })
        }
      >
        Add Custom
      </button>
      <button
        type="button"
        onClick={() =>
          addNotification({
            type: "info",
            message: "Default values",
          })
        }
      >
        Add Default
      </button>
      <button
        type="button"
        onClick={() =>
          addNotification({
            type: "error",
            message: "Error values",
          })
        }
      >
        Add Error
      </button>
      <button
        type="button"
        onClick={() => {
          for (let i = 0; i < 6; i++) {
            addNotification({ type: "info", message: `N${i.toString()}` });
          }
        }}
      >
        Add Six
      </button>
      <button
        type="button"
        onClick={() =>
          addNotification({
            id: "server-status",
            type: "warning",
            message: "Server waking up",
            duration: null,
            persistent: true,
          })
        }
      >
        Add Persistent
      </button>
      <button
        type="button"
        onClick={() =>
          addNotification({
            id: "server-status",
            type: "error",
            message: "Server is unreachable",
            duration: null,
            persistent: true,
          })
        }
      >
        Update Persistent
      </button>
      <button
        type="button"
        onClick={() => {
          addNotification({
            type: "info",
            id: "p1",
            message: "P1",
            persistent: true,
            duration: null,
          });
          addNotification({
            type: "error",
            id: "p2",
            message: "P2",
            persistent: true,
            duration: null,
          });
          addNotification({
            type: "info",
            id: "p3",
            message: "P3",
            persistent: true,
            duration: null,
          });
          addNotification({
            type: "info",
            id: "p4",
            message: "P4",
            persistent: true,
            duration: null,
          });
          addNotification({
            type: "success",
            id: "p5",
            message: "P5",
            persistent: true,
            duration: null,
          });
          addNotification({
            type: "warning",
            id: "p6",
            message: "P6",
            persistent: true,
            duration: null,
          });
        }}
      >
        Add Six Persistent
      </button>
      <button
        type="button"
        onClick={() => {
          const firstId = notifications[0]?.id;
          if (firstId) removeNotification(firstId);
        }}
      >
        Remove First
      </button>

      <div data-testid="count">{notifications.length}</div>
      <div data-testid="first-message">
        {notifications[0]?.message ?? "none"}
      </div>
      <div data-testid="last-message">
        {notifications[notifications.length - 1]?.message ?? "none"}
      </div>
      <div data-testid="first-type">{notifications[0]?.type ?? "none"}</div>
      <div data-testid="first-duration">
        {String(notifications[0]?.duration ?? "none")}
      </div>
      <div data-testid="first-persistent">
        {String(notifications[0]?.persistent ?? "none")}
      </div>
    </div>
  );
}

describe("useNotification", () => {
  test("adds notification with provided values", async () => {
    render(<NotificationProbe />);

    const addCustomButton = screen.getByRole("button", {
      name: /Add Custom/i,
    });

    expect(addCustomButton).toBeInTheDocument();
    await userEvent.click(addCustomButton);

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("first-message")).toHaveTextContent("Created");
    expect(screen.getByTestId("first-type")).toHaveTextContent("success");
    expect(screen.getByTestId("first-duration")).toHaveTextContent("1000");
  });

  test("uses default type and duration", async () => {
    render(<NotificationProbe />);

    const addDefaultButton = screen.getByRole("button", {
      name: /Add Default/i,
    });

    expect(addDefaultButton).toBeInTheDocument();
    await userEvent.click(addDefaultButton);

    expect(screen.getByTestId("first-type")).toHaveTextContent("info");
    expect(screen.getByTestId("first-duration")).toHaveTextContent("3000");
  });

  test("errors default to the longer alert duration", async () => {
    render(<NotificationProbe />);

    await userEvent.click(screen.getByRole("button", { name: /Add Error/i }));

    expect(screen.getByTestId("first-type")).toHaveTextContent("error");
    expect(screen.getByTestId("first-duration")).toHaveTextContent("8000");
  });

  test("keeps max 5 notifications and removes oldest", async () => {
    render(<NotificationProbe />);

    const addSixButton = screen.getByRole("button", { name: /^Add Six$/i });

    expect(addSixButton).toBeInTheDocument();
    await userEvent.click(addSixButton);

    expect(screen.getByTestId("count")).toHaveTextContent("5");
    expect(screen.getByTestId("first-message")).toHaveTextContent("N1");
    expect(screen.getByTestId("last-message")).toHaveTextContent("N5");
  });

  test("removes notification by id", async () => {
    render(<NotificationProbe />);

    const addCustomButton = screen.getByRole("button", {
      name: /Add Custom/i,
    });
    const removeFirstButton = screen.getByRole("button", {
      name: /Remove First/i,
    });

    expect(addCustomButton).toBeInTheDocument();
    expect(removeFirstButton).toBeInTheDocument();

    await userEvent.click(addCustomButton);
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await userEvent.click(removeFirstButton);

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("first-message")).toHaveTextContent("none");
  });

  test("keeps persistent notifications when max is exceeded", async () => {
    render(<NotificationProbe />);

    const addPersistentButton = screen.getByRole("button", {
      name: /Add Persistent/i,
    });
    const addSixButton = screen.getByRole("button", { name: /^Add Six$/i });

    await userEvent.click(addPersistentButton);
    await userEvent.click(addSixButton);

    expect(screen.getByTestId("count")).toHaveTextContent("5");
    expect(screen.getByTestId("first-message")).toHaveTextContent(
      "Server waking up",
    );
    expect(screen.getByTestId("last-message")).toHaveTextContent("N5");
    expect(screen.getByTestId("first-persistent")).toHaveTextContent("true");
  });

  test("replaces an existing notification when its id is reused", async () => {
    render(<NotificationProbe />);

    const addPersistentButton = screen.getByRole("button", {
      name: /Add Persistent/i,
    });
    const updatePersistentButton = screen.getByRole("button", {
      name: /Update Persistent/i,
    });

    await userEvent.click(addPersistentButton);
    await userEvent.click(updatePersistentButton);

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("first-message")).toHaveTextContent(
      "Server is unreachable",
    );
    expect(screen.getByTestId("first-type")).toHaveTextContent("error");
    expect(screen.getByTestId("first-duration")).toHaveTextContent("none");
    expect(screen.getByTestId("first-persistent")).toHaveTextContent("true");
  });

  test("does not evict existing notifications when list is full of persistent notifications", async () => {
    render(<NotificationProbe />);

    const addSixPersistentButton = screen.getByRole("button", {
      name: /Add Six Persistent/i,
    });

    await userEvent.click(addSixPersistentButton);

    expect(screen.getByTestId("count")).toHaveTextContent("5");
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.queryByText("P6")).not.toBeInTheDocument();
    expect(screen.getByTestId("first-persistent")).toHaveTextContent("true");
  });
});

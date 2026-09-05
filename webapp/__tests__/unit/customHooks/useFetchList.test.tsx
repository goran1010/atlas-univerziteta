import { render, screen, waitFor } from "@testing-library/react";
import { useFetchList } from "../../../src/customHooks/useFetchList";
import { RootContextProvider } from "../../utils/rootContextProvider";
import { guardedFetch } from "../../../src/utils/guardedFetch";
import { adminPendingChangesResponseSchema } from "../../../src/schemas/pendingChange";
import {
  SERVER_STATUS,
  ServerNotReadyError,
} from "../../../src/utils/serverStatus";

import type { RootContextType } from "../../../src/contextData/RootContext";

vi.mock("../../../src/utils/guardedFetch", () => ({
  guardedFetch: vi.fn(),
}));

const mockedGuardedFetch = vi.mocked(guardedFetch);
const identityTranslate = (key: string) => key;

interface HookProbeProps {
  setLoading: (loading: boolean) => void;
  enabled?: boolean;
}

function HookProbe({ setLoading, enabled }: HookProbeProps) {
  const [items] = useFetchList({
    path: "/users/admin/pending-changes",
    responseSchema: adminPendingChangesResponseSchema,
    successMessageKey: "messages.pendingChanges.loadSuccess",
    errorMessageKey: "messages.pendingChanges.fetchError",
    logLabel: "fetch pending changes",
    setLoading,
    enabled,
  });

  return <output data-testid="item-count">{items.length}</output>;
}

function Wrapper({
  addNotification,
  setLoading,
  serverStatus = SERVER_STATUS.LIVE,
  enabled,
}: {
  addNotification: RootContextType["addNotification"];
  setLoading: (loading: boolean) => void;
  serverStatus?: RootContextType["serverStatus"];
  enabled?: boolean;
}) {
  return (
    <RootContextProvider
      rootValue={{ addNotification, serverStatus, t: identityTranslate }}
    >
      <HookProbe setLoading={setLoading} enabled={enabled} />
    </RootContextProvider>
  );
}

beforeEach(() => {
  mockedGuardedFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useFetchList", () => {
  test("stores validated items from a successful response", async () => {
    const addNotification = vi.fn();
    mockedGuardedFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Pending changes retrieved successfully.",
          data: [
            {
              id: "pending-change-1",
              entityType: "UNIVERSITY",
              typeOfChange: "CREATE",
              targetId: null,
              parentId: null,
              data: {
                name: "University of Sarajevo",
                city: "Sarajevo",
                entity: "FBIH",
                ownership: "PUBLIC",
              },
              userId: "user-1",
              user: { email: "user@example.com", role: "USER" },
              createdAt: "2026-07-25T10:00:00.000Z",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<Wrapper addNotification={addNotification} setLoading={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");
    });
    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/admin/pending-changes"),
      expect.objectContaining({ method: "GET", credentials: "include" }),
      expect.objectContaining({ serverStatus: SERVER_STATUS.LIVE }),
    );
    expect(addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.pendingChanges.loadSuccess",
    });
  });

  test("rejects data that does not match the schema", async () => {
    const addNotification = vi.fn();
    mockedGuardedFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Pending changes retrieved successfully.",
          data: [
            {
              id: "pending-change-1",
              entityType: "UNIVERSITY",
              typeOfChange: "CREATE",
              targetId: null,
              parentId: null,
              data: { email: "user@example.com", role: "USER" },
              userId: "user-1",
              user: { email: "user@example.com", role: "USER" },
              createdAt: "2026-07-25T10:00:00.000Z",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<Wrapper addNotification={addNotification} setLoading={vi.fn()} />);

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith({
        type: "error",
        message: "messages.pendingChanges.fetchError",
      });
    });
    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("uses the translated error message when the request fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    const addNotification = vi.fn();
    const setLoading = vi.fn();
    mockedGuardedFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Access denied" } }), {
        status: 403,
      }),
    );

    render(
      <Wrapper addNotification={addNotification} setLoading={setLoading} />,
    );

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith({
        type: "error",
        message: "messages.pendingChanges.fetchError",
      });
    });
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  test("uses the fallback error message when the API error body is invalid", async () => {
    const addNotification = vi.fn();
    mockedGuardedFetch.mockResolvedValue(
      new Response("not valid JSON", { status: 500 }),
    );

    render(<Wrapper addNotification={addNotification} setLoading={vi.fn()} />);

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith({
        type: "error",
        message: "messages.pendingChanges.fetchError",
      });
    });
    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
  });

  test("does not notify when the server is not ready", async () => {
    const addNotification = vi.fn();
    const setLoading = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedGuardedFetch.mockRejectedValue(
      new ServerNotReadyError(SERVER_STATUS.WAKING),
    );

    render(
      <Wrapper addNotification={addNotification} setLoading={setLoading} />,
    );

    await waitFor(() => {
      expect(setLoading).toHaveBeenLastCalledWith(false);
    });
    expect(addNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test("does not fetch until the server is live", () => {
    const addNotification = vi.fn();

    render(
      <Wrapper
        addNotification={addNotification}
        setLoading={vi.fn()}
        serverStatus={SERVER_STATUS.WAKING}
      />,
    );

    expect(mockedGuardedFetch).not.toHaveBeenCalled();
    expect(addNotification).not.toHaveBeenCalled();
  });

  test("does not fetch when disabled", () => {
    render(
      <Wrapper
        addNotification={vi.fn()}
        setLoading={vi.fn()}
        enabled={false}
      />,
    );

    expect(mockedGuardedFetch).not.toHaveBeenCalled();
  });
});

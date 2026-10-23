import { render, screen, waitFor } from "@testing-library/react";
import { useFetchList } from "../../../src/customHooks/useFetchList";
import { RootContextProvider } from "../../utils/rootContextProvider";
import { makeUser } from "../../utils/makeUser";
import { server, http, HttpResponse } from "../../utils/msw";
import { adminPendingChangesResponseSchema } from "../../../src/schemas/pendingChange";

import type { AddNotification } from "../../../src/types";

const identityTranslate = (key: string) => key;

interface HookProbeProps {
  setLoading: (loading: boolean) => void;
  enabled?: boolean;
}

function HookProbe({ setLoading, enabled }: HookProbeProps) {
  const [items] = useFetchList({
    path: "/users/admin/pending-changes",
    responseSchema: adminPendingChangesResponseSchema,
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
  enabled,
}: {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  enabled?: boolean;
}) {
  return (
    <RootContextProvider rootValue={{ addNotification, t: identityTranslate }}>
      <HookProbe setLoading={setLoading} enabled={enabled} />
    </RootContextProvider>
  );
}

const validPendingChange = {
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
  user: makeUser({ email: "user@example.com" }),
  createdAt: "2026-07-25T10:00:00.000Z",
};

let requests: Request[] = [];

function givenResponse(body: unknown, status = 200) {
  server.use(
    http.get("*/users/admin/pending-changes", ({ request }) => {
      requests.push(request);
      return HttpResponse.json(body as Record<string, unknown>, { status });
    }),
  );
}

beforeEach(() => {
  requests = [];
});

describe("useFetchList", () => {
  test("stores validated items from a successful response", async () => {
    const addNotification = vi.fn();
    // msw 3 no longer preserves `credentials` on the intercepted Request,
    // so assert the fetch init directly
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    givenResponse({
      message: "Pending changes retrieved successfully.",
      data: [validPendingChange],
    });

    render(<Wrapper addNotification={addNotification} setLoading={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");
    });
    expect(requests).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/users/admin/pending-changes"),
      expect.objectContaining({ credentials: "include" }),
    );
    fetchSpy.mockRestore();
    // passive loads are their own confirmation - no success toast
    expect(addNotification).not.toHaveBeenCalled();
  });

  test("rejects data that does not match the schema", async () => {
    const addNotification = vi.fn();
    givenResponse({
      message: "Pending changes retrieved successfully.",
      data: [{ ...validPendingChange, data: { unexpected: "shape" } }],
    });
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
    givenResponse({ error: { message: "Access denied" } }, 403);

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
    server.use(
      http.get(
        "*/users/admin/pending-changes",
        () => new HttpResponse("not valid JSON", { status: 500 }),
      ),
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

  test("does not fetch when disabled", () => {
    givenResponse({ message: "ok", data: [] });

    render(
      <Wrapper
        addNotification={vi.fn()}
        setLoading={vi.fn()}
        enabled={false}
      />,
    );

    expect(requests).toHaveLength(0);
  });
});

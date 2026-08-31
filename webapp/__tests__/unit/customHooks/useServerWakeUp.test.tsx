import { act, render, screen } from "@testing-library/react";
import { useServerWakeUp } from "../../../src/customHooks/useServerWakeUp";

import type { Notification } from "../../../src/types/notification";

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => vi.fn());
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const identityTranslate = (key: string) => key;

interface ServerWakeUpProbeProps {
  setLongWait: (notification: Notification) => void;
  setServerIsDown: (id: string | undefined) => void;
}

function ServerWakeUpProbe({
  setLongWait,
  setServerIsDown,
}: ServerWakeUpProbeProps) {
  const serverStatus = useServerWakeUp({
    addNotification: setLongWait,
    removeNotification: setServerIsDown,
    t: identityTranslate,
  });

  return <div data-testid="server-wake-up-probe">{serverStatus}</div>;
}

const mockedResponse = new Response(
  JSON.stringify({
    message: "Server is live",
  }),
  {
    status: 200,
    headers: { "Content-Type": "application/json" },
  },
);

describe("useServerWakeUp", () => {
  test("starts in the waking state and pings the health endpoint", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockedResponse);
    const setLongWait = vi.fn();
    const setServerIsDown = vi.fn();

    render(
      <ServerWakeUpProbe
        setLongWait={setLongWait}
        setServerIsDown={setServerIsDown}
      />,
    );

    expect(screen.getByTestId("server-wake-up-probe")).toHaveTextContent(
      "waking",
    );

    await act(async () => {
      await flushMicrotasks();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/health$/),
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("clears long wait and never shows the banner when server responds ok", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockedResponse);
    const setLongWait = vi.fn();
    const setServerIsDown = vi.fn();

    render(
      <ServerWakeUpProbe
        setLongWait={setLongWait}
        setServerIsDown={setServerIsDown}
      />,
    );

    await act(async () => {
      await flushMicrotasks();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(setLongWait).not.toHaveBeenCalled();

    expect(setServerIsDown).toHaveBeenCalledWith("server-status");
    expect(screen.getByTestId("server-wake-up-probe")).toHaveTextContent(
      "live",
    );
  });

  test("retries when response is not ok and then succeeds", async () => {
    const mockedErrorResponse = new Response(
      JSON.stringify({
        message: "Wake up",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockedErrorResponse)
      .mockResolvedValueOnce(mockedResponse);
    const setLongWait = vi.fn();
    const setServerIsDown = vi.fn();

    render(
      <ServerWakeUpProbe
        setLongWait={setLongWait}
        setServerIsDown={setServerIsDown}
      />,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await flushMicrotasks();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(setLongWait).toHaveBeenCalledWith({
      id: "server-status",
      type: "warning",
      message: "longWait.wakingUp",
      duration: null,
      persistent: true,
    });
    expect(setServerIsDown).toHaveBeenCalledWith("server-status");
    expect(screen.getByTestId("server-wake-up-probe")).toHaveTextContent(
      "live",
    );
  });

  test("shows the waking banner when the ping fails with a network error", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockedResponse);
    const setLongWait = vi.fn();
    const setServerIsDown = vi.fn();

    render(
      <ServerWakeUpProbe
        setLongWait={setLongWait}
        setServerIsDown={setServerIsDown}
      />,
    );

    await act(async () => {
      await flushMicrotasks();
    });

    expect(setLongWait).toHaveBeenCalledWith({
      id: "server-status",
      type: "warning",
      message: "longWait.wakingUp",
      duration: null,
      persistent: true,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await flushMicrotasks();
    });

    expect(screen.getByTestId("server-wake-up-probe")).toHaveTextContent(
      "live",
    );
  });

  test("sets server down after max attempts on repeated fetch errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const setLongWait = vi.fn();
    const setServerIsDown = vi.fn();

    render(
      <ServerWakeUpProbe
        setLongWait={setLongWait}
        setServerIsDown={setServerIsDown}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
      await vi.advanceTimersByTimeAsync(2000 * 30);
      await flushMicrotasks();
    });

    expect(setLongWait).toHaveBeenLastCalledWith({
      id: "server-status",
      type: "error",
      message: "longWait.unreachable",
      duration: null,
      persistent: true,
    });
    expect(setServerIsDown).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    expect(screen.getByTestId("server-wake-up-probe")).toHaveTextContent(
      "down",
    );
  });
});

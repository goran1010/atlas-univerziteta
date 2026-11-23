import { render, screen } from "@testing-library/react";
import { server, http, HttpResponse } from "../../../utils/msw";

function givenTotals(totals: Record<string, number>) {
  for (const [path, total] of Object.entries(totals)) {
    server.use(
      http.get(`*/api/v1/${path}`, () =>
        HttpResponse.json({
          message: "ok",
          data: [],
          page: 1,
          totalPages: 1,
          total,
        }),
      ),
    );
  }
}

// the counts are cached for the page's lifetime, so every test loads a fresh
// copy of the module
async function renderCounts() {
  vi.resetModules();
  // the provider is imported fresh too, so both share the same RootContext
  const { RootContextProvider } =
    await import("../../../utils/rootContextProvider");
  const { DatasetCounts } =
    await import("../../../../src/components/HomePage/DatasetCounts");
  const { container } = render(
    <RootContextProvider>
      <DatasetCounts />
    </RootContextProvider>,
  );
  return container;
}

describe("DatasetCounts", () => {
  test("shows each total with its plural form and the number of countries", async () => {
    givenTotals({ universities: 1, faculties: 900, "study-programs": 8149 });
    await renderCounts();

    // the matcher sees the non-breaking spaces as plain ones
    const line = await screen.findByText(
      "1 university · 900 faculties · 8149 study programs · 8 countries",
    );
    expect(line.textContent).toContain("8149\u00a0study programs");
  });

  test("stays empty when a count cannot be loaded", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    givenTotals({ universities: 110, faculties: 900 });
    server.use(
      http.get("*/api/v1/study-programs", () =>
        HttpResponse.json(
          { error: { code: "X", message: "x" } },
          { status: 500 },
        ),
      ),
    );
    const container = await renderCounts();

    await vi.waitFor(() => {
      expect(console.warn).toHaveBeenCalled();
    });
    expect(container.querySelector("p")).toHaveTextContent("");
    vi.restoreAllMocks();
  });
});

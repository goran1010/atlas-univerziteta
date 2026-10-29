import {
  searchAll,
  SearchFailedError,
} from "../../../../../src/components/Search/utils/search";
import { server, http, HttpResponse } from "../../../../utils/msw";
import { nth } from "../../../../utils/nth";

const emptyResults = {
  universities: [],
  faculties: [],
  studyPrograms: [],
};

let requestUrls: URL[] = [];

function givenSearchResponse() {
  server.use(
    http.get("*/api/v1/search", ({ request }) => {
      requestUrls.push(new URL(request.url));
      return HttpResponse.json({
        message: "Search results retrieved successfully.",
        data: emptyResults,
      });
    }),
  );
}

beforeEach(() => {
  requestUrls = [];
});

describe("searchAll", () => {
  test("sends the term and every filter as query parameters", async () => {
    givenSearchResponse();

    await searchAll("medicina", {
      country: "SRB",
      type: ["university", "faculty"],
    });

    const params = nth(requestUrls).searchParams;
    expect(params.get("searchTerm")).toBe("medicina");
    expect(params.get("country")).toBe("SRB");
    expect(params.getAll("type")).toEqual(["university", "faculty"]);
  });

  test("omits empty term and filters from the query", async () => {
    givenSearchResponse();

    await searchAll(undefined);

    expect([...nth(requestUrls).searchParams.keys()]).toEqual([]);
  });

  test("returns the parsed result data on success", async () => {
    givenSearchResponse();

    const data = await searchAll("term");

    expect(data).toEqual(emptyResults);
  });

  test("throws a SearchFailedError carrying the server error code", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => vi.fn());
    server.use(
      http.get("*/api/v1/search", () =>
        HttpResponse.json(
          { error: { code: "RATE_LIMITED", message: "Slow down." } },
          { status: 429 },
        ),
      ),
    );

    const failure = await searchAll("term").catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(SearchFailedError);
    expect((failure as SearchFailedError).code).toBe("RATE_LIMITED");
  });

  test("throws when a successful response has an invalid payload", async () => {
    server.use(
      http.get("*/api/v1/search", () =>
        HttpResponse.json({ message: "ok", data: { universities: "nope" } }),
      ),
    );

    await expect(searchAll("term")).rejects.toThrow();
  });

  test("rejects with an abort error when its signal aborts", async () => {
    server.use(
      http.get("*/api/v1/search", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json({ message: "ok", data: emptyResults });
      }),
    );
    const controller = new AbortController();

    const pending = searchAll("term", undefined, controller.signal);
    controller.abort();

    const failure = await pending.catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).name).toBe("AbortError");
  });
});

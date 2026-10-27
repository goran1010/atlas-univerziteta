import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw/http";

const emptySearchResults = {
  message: "Search results retrieved successfully.",
  data: {
    universities: [],
    faculties: [],
    studyPrograms: [],
    direct: { universities: 0, faculties: 0, studyPrograms: 0 },
  },
};

// Baseline handlers for requests the app shell fires on almost every
// render: an anonymous session and an empty search. Tests override these
// per case with server.use(...).
const defaultHandlers = [
  http.get("*/api/auth/get-session", () => HttpResponse.json(null)),
  http.get("*/api/v1/search", () => HttpResponse.json(emptySearchResults)),
];

const server = setupServer(...defaultHandlers);

export { server, http, HttpResponse };

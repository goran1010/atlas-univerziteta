import { notificationMessage } from "../../../src/utils/apiError";

const t = (key: string) => key;

describe("notificationMessage", () => {
  test("lists validation issues after the summary", () => {
    const message = notificationMessage(t, "messages.example.error", {
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      issues: [
        { path: "data.website", message: "Invalid URL" },
        { path: "data.name", message: "Name is required" },
      ],
    });

    expect(message).toBe(
      "messages.example.error (data.website: Invalid URL; data.name: Name is required)",
    );
  });

  test("appends the server message for unmapped codes", () => {
    const message = notificationMessage(t, "messages.example.error", {
      code: "NOT_FOUND",
      message: "University not found.",
    });

    expect(message).toBe("messages.example.error (University not found.)");
  });

  test("keeps dedicated translations clean", () => {
    const message = notificationMessage(t, "messages.example.error", {
      code: "RATE_LIMITED",
      message: "Too many requests. Please wait 15 minutes, then try again.",
    });

    expect(message).toBe("messages.apiError.rateLimited");
  });

  test("returns just the summary without a server error", () => {
    expect(notificationMessage(t, "messages.example.error", null)).toBe(
      "messages.example.error",
    );
  });
});

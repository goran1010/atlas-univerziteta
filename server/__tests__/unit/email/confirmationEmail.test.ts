import { describe, test, expect, vi, afterEach } from "vitest";
import { env } from "../../../src/config/env.js";

// The global setup replaces this module with a stub; this file tests the
// real implementation against a mocked Resend SDK.
vi.unmock("../../../src/email/confirmationEmail.js");

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const { sendConfirmationEmail } =
  await import("../../../src/email/confirmationEmail.js");

const originalNodeEnv = env.NODE_ENV;

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
  vi.clearAllMocks();
});

describe("sendConfirmationEmail", () => {
  test("skips sending outside production and reports success", async () => {
    const result = await sendConfirmationEmail(
      "user@example.com",
      "https://example.com/confirm",
    );

    expect(result).toEqual({ success: true, messageId: null });
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("sends via Resend in production with the confirmation link in the body", async () => {
    env.NODE_ENV = "production";
    sendMock.mockResolvedValue({ data: { id: "email-1" } });

    const result = await sendConfirmationEmail(
      "user@example.com",
      "https://example.com/confirm",
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const message = sendMock.mock.calls[0]?.[0] as {
      to: string[];
      subject: string;
      html: string;
    };
    expect(message.to).toEqual(["user@example.com"]);
    expect(message.subject).toBe("Confirm Your Email Address");
    expect(message.html).toContain("https://example.com/confirm");
    expect(result).toEqual({ success: true, messageId: { id: "email-1" } });
  });

  test("returns the error message when sending fails", async () => {
    env.NODE_ENV = "production";
    sendMock.mockRejectedValue(new Error("resend is down"));

    const result = await sendConfirmationEmail(
      "user@example.com",
      "https://example.com/confirm",
    );

    expect(result).toEqual({ success: false, error: "resend is down" });
  });

  test("returns a generic message for a non-Error failure", async () => {
    env.NODE_ENV = "production";
    sendMock.mockRejectedValue("string failure");

    const result = await sendConfirmationEmail(
      "user@example.com",
      "https://example.com/confirm",
    );

    expect(result).toEqual({
      success: false,
      error: "An unknown error occurred.",
    });
  });
});

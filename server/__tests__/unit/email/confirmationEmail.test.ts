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
  test("skips sending outside production", async () => {
    await expect(
      sendConfirmationEmail("user@example.com", "https://example.com/confirm"),
    ).resolves.toBeUndefined();
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("sends via Resend in production with the confirmation link in the body", async () => {
    env.NODE_ENV = "production";
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendConfirmationEmail(
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
  });

  test("throws when Resend resolves with an API error (bad key, domain)", async () => {
    env.NODE_ENV = "production";
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "API key is invalid", name: "validation_error" },
    });

    await expect(
      sendConfirmationEmail("user@example.com", "https://example.com/confirm"),
    ).rejects.toThrow("Confirmation email rejected: API key is invalid");
  });

  test("rethrows when the send itself fails", async () => {
    env.NODE_ENV = "production";
    sendMock.mockRejectedValue(new Error("resend is down"));

    await expect(
      sendConfirmationEmail("user@example.com", "https://example.com/confirm"),
    ).rejects.toThrow("resend is down");
  });
});

import { describe, test, expect, vi, afterEach } from "vitest";
import { env } from "../../../src/config/env.js";

// The global setup replaces this module with a stub; this file tests the
// real implementation against a mocked Resend SDK. The shared send contract
// (dev skip, API-error throw, network rethrow) is covered through the
// confirmation email tests - this one checks the reset email's own content.
vi.unmock("../../../src/email/resetPasswordEmail.js");

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const { sendResetPasswordEmail } =
  await import("../../../src/email/resetPasswordEmail.js");

const originalNodeEnv = env.NODE_ENV;

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
  vi.clearAllMocks();
});

describe("sendResetPasswordEmail", () => {
  test("sends via Resend in production with the reset link in the body", async () => {
    env.NODE_ENV = "production";
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });

    await sendResetPasswordEmail(
      "user@example.com",
      "https://example.com/reset",
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const message = sendMock.mock.calls[0]?.[0] as {
      to: string[];
      subject: string;
      html: string;
    };
    expect(message.to).toEqual(["user@example.com"]);
    expect(message.subject).toBe("Reset Your Password");
    expect(message.html).toContain("https://example.com/reset");
  });
});

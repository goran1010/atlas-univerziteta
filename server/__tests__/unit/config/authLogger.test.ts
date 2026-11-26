import { beforeEach, describe, test, expect, vi } from "vitest";

import { auth } from "../../../src/config/auth.js";
import { logger } from "../../../src/utils/logger.js";

// pino is mocked in mocks.setup.ts, so the logger methods are vi.fn
beforeEach(() => {
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.error).mockClear();
});

describe("better-auth logger", () => {
  test("forwards errors to pino with the Error under err", () => {
    const error = new Error("boom");

    auth.options.logger.log("error", "Invalid callbackURL: x", error, {
      provider: "github",
    });

    expect(logger.error).toHaveBeenCalledWith(
      { err: error, details: [{ provider: "github" }] },
      "Invalid callbackURL: x",
    );
  });

  test("forwards warnings without an error or details", () => {
    auth.options.logger.log("warn", "Something to look at");

    expect(logger.warn).toHaveBeenCalledWith(
      { err: undefined, details: undefined },
      "Something to look at",
    );
  });
});

import { adminRequestsResponseSchema } from "../../../src/schemas/adminRequest";

describe("adminRequestsResponseSchema", () => {
  const request = {
    id: "user-1",
    adminRequestedAt: "2026-07-25T10:00:00.000Z",
  };

  test("accepts an email the input check would reject", () => {
    expect(
      adminRequestsResponseSchema.safeParse({
        message: "ok",
        data: [{ ...request, email: "not-an-email" }],
      }).success,
    ).toBe(true);
  });

  test("still rejects an email that is not a string", () => {
    expect(
      adminRequestsResponseSchema.safeParse({
        message: "ok",
        data: [{ ...request, email: 42 }],
      }).success,
    ).toBe(false);
  });
});

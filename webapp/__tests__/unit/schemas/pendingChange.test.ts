import {
  adminPendingChangesResponseSchema,
  pendingChangesResponseSchema,
} from "../../../src/schemas/pendingChange";

const base = {
  id: "pending-change-1",
  userId: "user-1",
  createdAt: "2026-07-25T10:00:00.000Z",
  currentEntity: null,
  parentContext: null,
};

function listOf(change: Record<string, unknown>) {
  return { message: "ok", data: [{ ...base, ...change }] };
}

const studyProgramUpdate = {
  targetType: "STUDY_PROGRAM",
  typeOfChange: "UPDATE",
  targetId: 18,
  parentId: null,
};

describe("pending change data is read with types, not input rules", () => {
  test("keeps a duration over 10 years", () => {
    const result = pendingChangesResponseSchema.safeParse(
      listOf({ ...studyProgramUpdate, data: { durationYears: 11 } }),
    );

    expect(result.success).toBe(true);
    expect(result.data?.data[0]?.data).toEqual({ durationYears: 11 });
  });

  test("accepts a name over the input length cap and drops unknown keys", () => {
    const name = "a".repeat(300);
    const result = pendingChangesResponseSchema.safeParse(
      listOf({
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: null,
        data: {
          name,
          city: "Sarajevo",
          country: "BIH",
          entity: "FBIH",
          ownership: "PUBLIC",
          retiredField: "kept by an older server",
        },
      }),
    );

    expect(result.success).toBe(true);
    expect(result.data?.data[0]?.data).toEqual({
      name,
      city: "Sarajevo",
      country: "BIH",
      entity: "FBIH",
      ownership: "PUBLIC",
    });
  });

  test("accepts a tree that the input checks would reject", () => {
    const result = pendingChangesResponseSchema.safeParse(
      listOf({
        targetType: "FACULTY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: 1,
        data: {
          name: "Medicinski fakultet",
          website: "not a url",
          studyPrograms: [
            { name: "Medicina", cycle: "INTEGRATED", ects: 0 },
            { name: "Medicina", cycle: "INTEGRATED" },
          ],
        },
      }),
    );

    expect(result.success).toBe(true);
  });

  test("accepts a submitter email the input check would reject", () => {
    const result = adminPendingChangesResponseSchema.safeParse(
      listOf({
        ...studyProgramUpdate,
        data: { durationYears: 4 },
        user: { email: "not-an-email", role: "USER" },
      }),
    );

    expect(result.success).toBe(true);
  });

  test.each([
    ["a duration sent as a string", { durationYears: "4" }],
    ["an unknown cycle", { cycle: "NINTH" }],
    ["a name that is not a string", { name: 42 }],
  ])("still rejects %s", (_label, data) => {
    expect(
      pendingChangesResponseSchema.safeParse(
        listOf({ ...studyProgramUpdate, data }),
      ).success,
    ).toBe(false);
  });
});

import { universityCreateDataSchema } from "../../../src/schemas/contribution";

const validData = {
  name: "Test University",
  city: "Test City",
  entity: "FBIH",
  ownership: "PUBLIC",
};

describe("universityCreateDataSchema field length caps", () => {
  test("accepts fields at their max length", () => {
    const result = universityCreateDataSchema.safeParse({
      ...validData,
      name: "a".repeat(200),
      phone: "1".repeat(50),
    });

    expect(result.success).toBe(true);
  });

  test("rejects fields over their max length", () => {
    for (const data of [
      { ...validData, name: "a".repeat(201) },
      { ...validData, acronym: "a".repeat(21) },
      { ...validData, phone: "1".repeat(51) },
      { ...validData, email: `${"a".repeat(250)}@b.ba` },
    ]) {
      expect(universityCreateDataSchema.safeParse(data).success).toBe(false);
    }
  });
});

import {
  universityCreateDataSchema,
  universityTreeDataSchema,
} from "../../../src/schemas/contribution";

const validData = {
  name: "Test University",
  city: "Test City",
  country: "BIH",
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

describe("universityTreeDataSchema", () => {
  test("accepts a nested tree and a flat create alike", () => {
    expect(universityTreeDataSchema.safeParse(validData).success).toBe(true);

    const result = universityTreeDataSchema.safeParse({
      ...validData,
      faculties: [
        {
          name: "Fakultet A",
          studyPrograms: [
            {
              name: "Program X",
              cycle: "FIRST",
              ects: 180,
              tracks: [{ name: "Smjer 1" }],
            },
            { name: "Program X", cycle: "SECOND" },
          ],
        },
        { name: "Fakultet B" },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("rejects duplicate siblings with a path to the duplicate", () => {
    const duplicateFaculties = universityTreeDataSchema.safeParse({
      ...validData,
      faculties: [{ name: "Same" }, { name: "Same" }],
    });
    expect(duplicateFaculties.success).toBe(false);
    expect(duplicateFaculties.error?.issues[0]?.path).toEqual([
      "faculties",
      1,
      "name",
    ]);

    const duplicateTracks = universityTreeDataSchema.safeParse({
      ...validData,
      faculties: [
        {
          name: "Fakultet A",
          studyPrograms: [
            {
              name: "Program X",
              cycle: "FIRST",
              tracks: [{ name: "Same" }, { name: "Same" }],
            },
          ],
        },
      ],
    });
    expect(duplicateTracks.success).toBe(false);
    expect(duplicateTracks.error?.issues[0]?.path).toEqual([
      "faculties",
      0,
      "studyPrograms",
      0,
      "tracks",
      1,
      "name",
    ]);
  });

  test("rejects unknown fields on nested nodes and empty children arrays", () => {
    expect(
      universityTreeDataSchema.safeParse({
        ...validData,
        faculties: [
          { name: "Fakultet A", dataSourceUrl: "https://example.com" },
        ],
      }).success,
    ).toBe(false);

    expect(
      universityTreeDataSchema.safeParse({ ...validData, faculties: [] })
        .success,
    ).toBe(false);
  });

  test("caps the tree at 800 items", () => {
    const facultiesFor = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        name: `Fakultet ${String(index)}`,
      }));

    expect(
      universityTreeDataSchema.safeParse({
        ...validData,
        faculties: facultiesFor(799),
      }).success,
    ).toBe(true);

    const overCap = universityTreeDataSchema.safeParse({
      ...validData,
      faculties: facultiesFor(800),
    });
    expect(overCap.success).toBe(false);
    expect(overCap.error?.issues[0]?.message).toMatch(/at most 800 items/);
  });
});

import {
  unifiedSearchResponseSchema,
  universityDetailResponseSchema,
} from "../../../src/schemas/university";

const university = {
  id: 1,
  name: "Univerzitet u Sarajevu",
  city: "Sarajevo",
  country: "BIH",
  entity: "FBIH",
  ownership: "PUBLIC",
};

function searchResponse(program: Record<string, unknown>) {
  return {
    message: "ok",
    data: {
      universities: [],
      faculties: [],
      studyPrograms: [
        {
          id: 10,
          name: "Medicina",
          facultyId: 5,
          cycle: "INTEGRATED",
          faculty: {
            id: 5,
            name: "Medicinski fakultet",
            universityId: 1,
            university,
          },
          ...program,
        },
      ],
    },
  };
}

function detailResponse(program: Record<string, unknown>) {
  return {
    message: "ok",
    data: {
      ...university,
      faculties: [
        {
          id: 5,
          name: "Medicinski fakultet",
          universityId: 1,
          studyPrograms: [
            {
              id: 10,
              name: "Medicina",
              facultyId: 5,
              cycle: "INTEGRATED",
              ...program,
            },
          ],
        },
      ],
    },
  };
}

describe("response schemas check types, not input rules", () => {
  test.each([
    ["a duration over 10 years", { durationYears: 2010 }],
    ["zero ECTS", { ects: 0 }],
    ["an empty name", { name: "" }],
    [
      "a track duration over 10 years",
      { tracks: [{ id: 3, name: "Smjer", durationYears: 15 }] },
    ],
  ])("search results accept %s", (_label, program) => {
    expect(
      unifiedSearchResponseSchema.safeParse(searchResponse(program)).success,
    ).toBe(true);
  });

  test("university detail reads a program without languages as an empty list", () => {
    const result = universityDetailResponseSchema.safeParse(detailResponse({}));

    expect(result.data?.data.faculties[0]?.studyPrograms[0]?.languages).toEqual(
      [],
    );
  });

  test("university detail keeps a language code the webapp has no name for", () => {
    const result = universityDetailResponseSchema.safeParse(
      detailResponse({ languages: ["bs", "xx"] }),
    );

    expect(result.data?.data.faculties[0]?.studyPrograms[0]?.languages).toEqual(
      ["bs", "xx"],
    );
  });

  test("university detail accepts a duration over 10 years", () => {
    const result = universityDetailResponseSchema.safeParse(
      detailResponse({ durationYears: 2010 }),
    );

    expect(result.success).toBe(true);
    expect(
      result.data?.data.faculties[0]?.studyPrograms[0]?.durationYears,
    ).toBe(2010);
  });

  test.each([
    ["a duration sent as a string", { durationYears: "4" }],
    ["a fractional duration", { durationYears: 2.5 }],
    ["ECTS sent as a string", { ects: "240" }],
    ["a name that is not a string", { name: 42 }],
  ])("search results still reject %s", (_label, program) => {
    expect(
      unifiedSearchResponseSchema.safeParse(searchResponse(program)).success,
    ).toBe(false);
  });
});

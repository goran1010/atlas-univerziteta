import { countNestedNodes } from "../../../src/utils/countNestedNodes";

describe("countNestedNodes", () => {
  test("returns 0 for a flat payload", () => {
    expect(countNestedNodes({ name: "Flat University" })).toBe(0);
    expect(countNestedNodes({})).toBe(0);
  });

  test("counts every descendant across all levels", () => {
    const tree = {
      name: "Tree University",
      faculties: [
        {
          name: "Faculty A",
          studyPrograms: [
            {
              name: "Program X",
              tracks: [{ name: "Track 1" }, { name: "Track 2" }],
            },
          ],
        },
        { name: "Faculty B" },
      ],
    };

    // 2 faculties + 1 program + 2 tracks
    expect(countNestedNodes(tree)).toBe(5);
  });

  test("counts tracks directly under a study program subtree", () => {
    expect(
      countNestedNodes({
        name: "Program",
        tracks: [{ name: "Track 1" }],
      }),
    ).toBe(1);
  });
});

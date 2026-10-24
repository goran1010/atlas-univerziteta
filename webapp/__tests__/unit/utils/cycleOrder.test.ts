import { byCycleDisplayOrder, cycleRank } from "../../../src/utils/cycleOrder";

describe("cycleRank", () => {
  test("ranks integrated programs first and specialists last", () => {
    expect(cycleRank("INTEGRATED")).toBe(0);
    expect(cycleRank("FIRST")).toBeLessThan(cycleRank("SECOND"));
    expect(cycleRank("SECOND")).toBeLessThan(cycleRank("THIRD"));
    expect(cycleRank("SPECIALIST")).toBe(5);
  });
});

describe("byCycleDisplayOrder", () => {
  test("sorts programs into display order without mutating the input", () => {
    const programs = [
      { id: 1, cycle: "SECOND" as const },
      { id: 2, cycle: "INTEGRATED" as const },
      { id: 3, cycle: "FIRST" as const },
    ];

    const sorted = byCycleDisplayOrder(programs);

    expect(sorted.map((p) => p.cycle)).toEqual([
      "INTEGRATED",
      "FIRST",
      "SECOND",
    ]);
    expect(programs.map((p) => p.cycle)).toEqual([
      "SECOND",
      "INTEGRATED",
      "FIRST",
    ]);
  });

  test("keeps equal cycles in their original order", () => {
    const programs = [
      { id: 1, cycle: "FIRST" as const },
      { id: 2, cycle: "FIRST" as const },
    ];

    expect(byCycleDisplayOrder(programs).map((p) => p.id)).toEqual([1, 2]);
  });
});

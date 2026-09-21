import type { StudyCycle } from "../../../schemas/domain";

// display order for study cycles: integrated programs lead, then the
// regular cycle sequence (the API returns schema-enum order instead)
const CYCLE_DISPLAY_ORDER: StudyCycle[] = [
  "INTEGRATED",
  "FIRST",
  "SECOND",
  "THIRD",
  "VOCATIONAL",
  "SPECIALIST",
];

function cycleRank(cycle: StudyCycle): number {
  return CYCLE_DISPLAY_ORDER.indexOf(cycle);
}

function byCycleDisplayOrder<T extends { cycle: StudyCycle }>(items: T[]): T[] {
  return items.toSorted((a, b) => cycleRank(a.cycle) - cycleRank(b.cycle));
}

export { CYCLE_DISPLAY_ORDER, byCycleDisplayOrder, cycleRank };

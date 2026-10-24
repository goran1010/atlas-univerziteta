import type { TargetType, TypeOfChange } from "../../../schemas/domain";

const ENTITY_LEVELS: Record<TargetType, number> = {
  UNIVERSITY: 1,
  FACULTY: 2,
  STUDY_PROGRAM: 3,
  TRACK: 4,
};

// Depth = how many cascading selects the picker shows. UPDATE/DELETE drill
// down to the entity itself; CREATE stops one level up, at the parent the
// new entity goes under.
function getPickerDepth(
  targetType: TargetType,
  typeOfChange: TypeOfChange,
): number {
  const level = ENTITY_LEVELS[targetType];
  return typeOfChange === "CREATE" ? level - 1 : level;
}

export { getPickerDepth };

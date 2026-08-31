import type { EntityType, TypeOfChange } from "../../../schemas/domain";

const ENTITY_LEVELS: Record<EntityType, number> = {
  UNIVERSITY: 1,
  FACULTY: 2,
  STUDY_PROGRAM: 3,
  TRACK: 4,
};

// Depth = how many cascading selects the picker shows. UPDATE/DELETE drill
// down to the entity itself; CREATE stops one level up, at the parent the
// new entity goes under.
function getPickerDepth(
  entityType: EntityType,
  typeOfChange: TypeOfChange,
): number {
  const level = ENTITY_LEVELS[entityType];
  return typeOfChange === "CREATE" ? level - 1 : level;
}

export { getPickerDepth };

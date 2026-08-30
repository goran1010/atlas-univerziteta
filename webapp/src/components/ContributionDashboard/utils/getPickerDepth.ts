import type { EntityType, TypeOfChange } from "../../../schemas/domain";

const ENTITY_LEVELS: Record<EntityType, number> = {
  UNIVERSITY: 1,
  FACULTY: 2,
  STUDY_PROGRAM: 3,
  TRACK: 4,
};

function getPickerDepth(
  entityType: EntityType,
  typeOfChange: TypeOfChange,
): number {
  const level = ENTITY_LEVELS[entityType];
  return typeOfChange === "CREATE" ? level - 1 : level;
}

export { getPickerDepth };

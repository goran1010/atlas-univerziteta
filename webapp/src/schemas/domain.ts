import { z } from "zod";

const targetTypeSchema = z.enum([
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
  "TRACK",
]);
const countrySchema = z.enum(["BIH", "HRV", "MNE", "SRB"]);

// countries whose universities each belong to one subdivision; a country
// missing from this map takes no entity
const SUBDIVISIONS = {
  BIH: ["FBIH", "RS", "BD"],
} as const satisfies Partial<Record<Country, readonly string[]>>;

const ENTITIES = Object.values(SUBDIVISIONS).flat();
const entitySchema = z.enum(ENTITIES);
const ownershipSchema = z.enum(["PUBLIC", "PRIVATE"]);
const studyCycleSchema = z.enum([
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
]);
const searchTypeSchema = z.enum(["university", "faculty", "studyProgram"]);
const userRoleSchema = z.enum(["ADMIN", "USER"]);

const integerSchema = z.number().int();
const positiveIntegerSchema = integerSchema.positive();
const durationYearsSchema = integerSchema.min(1).max(10);
const ectsSchema = positiveIntegerSchema;
export type Country = z.infer<typeof countrySchema>;
export type Entity = z.infer<typeof entitySchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;
export type Ownership = z.infer<typeof ownershipSchema>;
export type StudyCycle = z.infer<typeof studyCycleSchema>;
export type TypeOfChange = "CREATE" | "UPDATE" | "DELETE";
export type SearchType = z.infer<typeof searchTypeSchema>;

const COUNTRIES = countrySchema.options;

function subdivisionsOf(country: Country): readonly Entity[] | undefined {
  const subdivisionsByCountry: Partial<Record<Country, readonly Entity[]>> =
    SUBDIVISIONS;
  return subdivisionsByCountry[country];
}

function entityFitsCountry(
  country: Country,
  entity: Entity | null | undefined,
): boolean {
  const entities = subdivisionsOf(country);
  if (entities === undefined) return entity === undefined || entity === null;
  return entity !== undefined && entity !== null && entities.includes(entity);
}

const ENTITY_RULE_MESSAGE =
  "Entity must be one of the country's subdivisions, and is only set for countries that have them";

export {
  COUNTRIES,
  ENTITIES,
  SUBDIVISIONS,
  ENTITY_RULE_MESSAGE,
  entityFitsCountry,
  subdivisionsOf,
  countrySchema,
  durationYearsSchema,
  ectsSchema,
  entitySchema,
  targetTypeSchema,
  integerSchema,
  ownershipSchema,
  positiveIntegerSchema,
  searchTypeSchema,
  studyCycleSchema,
  userRoleSchema,
};

const COUNTRIES = ["ALB", "BIH", "HRV", "MNE", "SRB"] as const;

type Country = (typeof COUNTRIES)[number];

// countries whose universities each belong to one subdivision; a country
// missing from this map takes no entity
const SUBDIVISIONS = {
  BIH: ["FBIH", "RS", "BD"],
} as const satisfies Partial<Record<Country, readonly string[]>>;

const ENTITIES = Object.values(SUBDIVISIONS).flat();

const subdivisionsByCountry: Partial<Record<string, readonly string[]>> =
  SUBDIVISIONS;

function entityFitsCountry(
  country: string,
  entity: string | null | undefined,
): boolean {
  const entities = subdivisionsByCountry[country];
  if (entities === undefined) return entity === undefined || entity === null;
  return entity !== undefined && entity !== null && entities.includes(entity);
}

const ENTITY_RULE_MESSAGE =
  "Entity must be one of the country's subdivisions, and is only set for countries that have them";

export {
  COUNTRIES,
  SUBDIVISIONS,
  ENTITIES,
  ENTITY_RULE_MESSAGE,
  entityFitsCountry,
};
export type { Country };

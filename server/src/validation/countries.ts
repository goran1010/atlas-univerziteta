const COUNTRIES = ["BIH", "HRV", "MNE", "SRB"] as const;

type Country = (typeof COUNTRIES)[number];

// countries whose universities each belong to one subdivision; a country
// missing from this map takes no entity
const SUBDIVISIONS = {
  BIH: ["FBIH", "RS", "BD"],
} as const satisfies Partial<Record<Country, readonly string[]>>;

const ENTITIES = Object.values(SUBDIVISIONS).flat();

export { COUNTRIES, SUBDIVISIONS, ENTITIES };
export type { Country };

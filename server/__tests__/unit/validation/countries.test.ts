import { describe, test, expect } from "vitest";
import {
  COUNTRIES,
  SUBDIVISIONS,
  entityFitsCountry,
} from "../../../src/validation/countries.js";

describe("entityFitsCountry", () => {
  test.each(SUBDIVISIONS.BIH)("accepts BIH with its entity %s", (entity) => {
    expect(entityFitsCountry("BIH", entity)).toBe(true);
  });

  test.each([undefined, null])("rejects BIH with entity %s", (entity) => {
    expect(entityFitsCountry("BIH", entity)).toBe(false);
  });

  test("rejects BIH with an entity outside its subdivisions", () => {
    expect(entityFitsCountry("BIH", "XX")).toBe(false);
  });

  test.each(COUNTRIES.filter((country) => !(country in SUBDIVISIONS)))(
    "accepts %s without an entity and rejects it with one",
    (country) => {
      expect(entityFitsCountry(country, undefined)).toBe(true);
      expect(entityFitsCountry(country, null)).toBe(true);
      expect(entityFitsCountry(country, "FBIH")).toBe(false);
    },
  );
});

/* cspell:disable */
import { describe, test, expect } from "vitest";
import {
  universitySearchFields,
  facultySearchFields,
} from "../../../src/search/fields.js";

describe("searchCity", () => {
  test("drops whitespace from a university city", () => {
    expect(universitySearchFields({ city: "Banja Luka" })).toEqual({
      searchCity: "banjaluka",
    });
    expect(universitySearchFields({ city: "Istočno  Sarajevo" })).toEqual({
      searchCity: "istocnosarajevo",
    });
  });

  test("drops whitespace from a faculty city and keeps null", () => {
    expect(facultySearchFields({ city: "Novi Sad" })).toEqual({
      searchCity: "novisad",
    });
    expect(facultySearchFields({ city: null })).toEqual({ searchCity: null });
  });

  test("keeps whitespace in names", () => {
    expect(
      universitySearchFields({ name: "Univerzitet u Banjoj Luci" }),
    ).toEqual({ searchName: "univerzitet u banjoj luci" });
  });
});

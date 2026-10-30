import {
  ENUM_ALIASES,
  COUNTRY_ALIASES,
  ENTITIES,
  OWNERSHIPS,
  CYCLES,
} from "./aliases.js";

import type { SearchToken } from "./tokenize.js";

type WhereClause = Record<string, unknown>;

// The search* columns and the token stems are folded the same way (see
// fold.ts), so one case-sensitive `contains` per field is enough.
function foldedContains(field: string, stem: string): WhereClause {
  return { [field]: { contains: stem } };
}

function enumMatch(
  field: string,
  values: readonly string[],
  word: string,
  stem: string,
): WhereClause[] {
  for (const form of [word.toUpperCase(), stem.toUpperCase()]) {
    const candidate = ENUM_ALIASES[form] ?? form;
    const match = values.find((value) => value === candidate);
    if (match) return [{ [field]: match }];
  }
  return [];
}

function countryMatch(word: string, stem: string): WhereClause[] {
  for (const form of [word.toUpperCase(), stem.toUpperCase()]) {
    const country = COUNTRY_ALIASES[form];
    if (country) return [{ country }];
  }
  return [];
}

// Every entity is searchable through its own fields, its ancestors and its
// descendants: "banja luka informatika" reaches a study program through its
// university's city, and the same university is found through the program.
// The own-field matchers below are composed upward (nested relation clauses)
// and downward (`some` on child relations) into one full matcher per model.

function universityOwnMatch(token: SearchToken): WhereClause[] {
  if (token.kind === "number") {
    return [{ foundedYear: { contains: String(token.value) } }];
  }
  if (token.kind !== "text") return [];
  return [
    foldedContains("searchName", token.stem),
    foldedContains("searchCity", token.stem),
    foldedContains("searchAcronym", token.stem),
    ...countryMatch(token.word, token.stem),
    ...enumMatch("entity", ENTITIES, token.word, token.stem),
    ...enumMatch("ownership", OWNERSHIPS, token.word, token.stem),
  ];
}

function facultyOwnMatch(token: SearchToken): WhereClause[] {
  if (token.kind !== "text") return [];
  return [
    foldedContains("searchName", token.stem),
    foldedContains("searchCity", token.stem),
  ];
}

// study programs and tracks share the same numeric fields
function numericMatch(token: SearchToken): WhereClause[] {
  if (token.kind === "ects") return [{ ects: token.value }];
  if (token.kind === "duration") return [{ durationYears: token.value }];
  if (token.kind === "number") {
    return [{ ects: token.value }, { durationYears: token.value }];
  }
  return [];
}

function studyProgramOwnMatch(token: SearchToken): WhereClause[] {
  if (token.kind !== "text") return numericMatch(token);
  return [
    foldedContains("searchName", token.stem),
    foldedContains("searchLanguage", token.stem),
    ...enumMatch("cycle", CYCLES, token.word, token.stem),
  ];
}

function trackOwnMatch(token: SearchToken): WhereClause[] {
  if (token.kind !== "text") return numericMatch(token);
  return [foldedContains("searchName", token.stem)];
}

function studyProgramDownMatch(token: SearchToken): WhereClause[] {
  const trackClauses = trackOwnMatch(token);
  return trackClauses.length
    ? [{ tracks: { some: { OR: trackClauses } } }]
    : [];
}

function facultyDownMatch(token: SearchToken): WhereClause[] {
  const programClauses = [
    ...studyProgramOwnMatch(token),
    ...studyProgramDownMatch(token),
  ];
  return programClauses.length
    ? [{ studyPrograms: { some: { OR: programClauses } } }]
    : [];
}

function universityDownMatch(token: SearchToken): WhereClause[] {
  const facultyClauses = [
    ...facultyOwnMatch(token),
    ...facultyDownMatch(token),
  ];
  return facultyClauses.length
    ? [{ faculties: { some: { OR: facultyClauses } } }]
    : [];
}

function universityFullMatch(token: SearchToken): WhereClause[] {
  return [...universityOwnMatch(token), ...universityDownMatch(token)];
}

function facultyFullMatch(token: SearchToken): WhereClause[] {
  return [
    ...facultyOwnMatch(token),
    ...universityOwnMatch(token).map((clause) => ({ university: clause })),
    ...facultyDownMatch(token),
  ];
}

function studyProgramFullMatch(token: SearchToken): WhereClause[] {
  return [
    ...studyProgramOwnMatch(token),
    ...facultyOwnMatch(token).map((clause) => ({ faculty: clause })),
    ...universityOwnMatch(token).map((clause) => ({
      faculty: { university: clause },
    })),
    ...studyProgramDownMatch(token),
  ];
}

// Every token must match (AND across tokens, OR across fields per token).
function tokenWhere(
  tokens: SearchToken[],
  matcher: (token: SearchToken) => WhereClause[],
): WhereClause[] {
  return tokens.map((token) => ({ OR: matcher(token) }));
}

export {
  universityOwnMatch,
  universityFullMatch,
  facultyOwnMatch,
  facultyFullMatch,
  studyProgramOwnMatch,
  studyProgramFullMatch,
  tokenWhere,
};
export type { WhereClause };

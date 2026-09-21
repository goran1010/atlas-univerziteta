import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { tokenizeSearchTerm } from "../utils/searchVariants.js";

import type { SearchToken } from "../utils/searchVariants.js";

import type { Request, Response } from "express";
import * as universityValidation from "../validation/universityValidation.js";

function status(_req: Request, res: Response) {
  sendSuccess(res, {
    data: {
      status: "ok",
    },
    message: "API v1 server is running",
  });
}

async function getUniversities(_req: Request, res: Response) {
  const universities = await prisma.university.findMany({
    orderBy: [{ ownership: "asc" }, { name: "asc" }],
    include: { _count: { select: { faculties: true } } },
  });
  sendSuccess(res, {
    message: "Universities retrieved successfully.",
    data: universities,
  });
}

// Bosnian/Serbian terms and common synonyms mapped to the English enum
// values, so search matches in both languages (e.g. "javna" -> PUBLIC).
const ENUM_ALIASES: Record<string, string> = {
  JAVNI: "PUBLIC",
  JAVNA: "PUBLIC",
  PRIVATNI: "PRIVATE",
  PRIVATNA: "PRIVATE",
  PRVI: "FIRST",
  BACHELOR: "FIRST",
  DRUGI: "SECOND",
  MASTER: "SECOND",
  TRECI: "THIRD",
  TREĆI: "THIRD",
  DOCTORAL: "THIRD",
  PHD: "THIRD",
  INTEGRISANI: "INTEGRATED",
  STRUCNI: "VOCATIONAL",
  STRUČNI: "VOCATIONAL",
  SPECIJALISTICKI: "SPECIALIST",
  SPECIJALISTIČKI: "SPECIALIST",
};

const ENTITIES = ["FBIH", "RS", "BD"] as const;
const OWNERSHIPS = ["PUBLIC", "PRIVATE"] as const;
const CYCLES = [
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
] as const;

// In the combined (federated) view each section is capped and reports its
// true total; a request for exactly one type returns everything.
const FEDERATED_SECTION_LIMIT = 20;

type WhereClause = Record<string, unknown>;

function containsAny(variants: string[], field: string): WhereClause[] {
  return variants.map((variant) => ({
    [field]: { contains: variant, mode: "insensitive" as const },
  }));
}

function enumMatch(
  field: string,
  values: readonly string[],
  word: string,
): WhereClause[] {
  const upper = word.toUpperCase();
  const candidate = ENUM_ALIASES[upper] ?? upper;
  const match = values.find((value) => value === candidate);
  return match ? [{ [field]: match }] : [];
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
    ...containsAny(token.variants, "name"),
    ...containsAny(token.variants, "city"),
    ...containsAny(token.variants, "acronym"),
    ...enumMatch("entity", ENTITIES, token.word),
    ...enumMatch("ownership", OWNERSHIPS, token.word),
  ];
}

function facultyOwnMatch(token: SearchToken): WhereClause[] {
  if (token.kind !== "text") return [];
  return [
    ...containsAny(token.variants, "name"),
    ...containsAny(token.variants, "city"),
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
    ...containsAny(token.variants, "name"),
    ...containsAny(token.variants, "language"),
    ...enumMatch("cycle", CYCLES, token.word),
  ];
}

function trackOwnMatch(token: SearchToken): WhereClause[] {
  if (token.kind !== "text") return numericMatch(token);
  return containsAny(token.variants, "name");
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

function trackFullMatch(token: SearchToken): WhereClause[] {
  return [
    ...trackOwnMatch(token),
    ...studyProgramOwnMatch(token).map((clause) => ({ studyProgram: clause })),
    ...facultyOwnMatch(token).map((clause) => ({
      studyProgram: { faculty: clause },
    })),
    ...universityOwnMatch(token).map((clause) => ({
      studyProgram: { faculty: { university: clause } },
    })),
  ];
}

// Every token must match (AND across tokens, OR across fields per token).
function tokenWhere(
  tokens: SearchToken[],
  matcher: (token: SearchToken) => WhereClause[],
): WhereClause[] {
  return tokens.map((token) => ({ OR: matcher(token) }));
}

interface SectionQuery<Item> {
  count: (where: WhereClause) => Promise<number>;
  findMany: (where: WhereClause, take: number | undefined) => Promise<Item[]>;
}

// Under the federated cap, entities matching every token in their OWN fields
// fill the section first; context-only matches top it up. The cap decides
// which items survive, so weak matches must not crowd out direct ones.
async function searchSection<Item extends { id: number }>(
  query: SectionQuery<Item>,
  tokens: SearchToken[],
  ownMatcher: (token: SearchToken) => WhereClause[],
  fullMatcher: (token: SearchToken) => WhereClause[],
  filters: WhereClause[],
  limit: number | undefined,
): Promise<{ items: Item[]; total: number }> {
  const fullWhere = { AND: [...tokenWhere(tokens, fullMatcher), ...filters] };

  if (limit === undefined || tokens.length === 0) {
    const items = await query.findMany(fullWhere, limit);
    const total =
      limit === undefined ? items.length : await query.count(fullWhere);
    return { items, total };
  }

  const [total, ownItems] = await Promise.all([
    query.count(fullWhere),
    query.findMany(
      { AND: [...tokenWhere(tokens, ownMatcher), ...filters] },
      limit,
    ),
  ]);

  if (ownItems.length >= limit) return { items: ownItems, total };

  const contextItems = await query.findMany(
    {
      AND: [
        ...tokenWhere(tokens, fullMatcher),
        ...filters,
        { id: { notIn: ownItems.map((item) => item.id) } },
      ],
    },
    limit - ownItems.length,
  );

  return { items: [...ownItems, ...contextItems], total };
}

async function search(req: Request, res: Response) {
  const { searchTerm, entity, ownership, cycle, type } =
    universityValidation.searchQuery(req.query);

  const tokens = searchTerm === undefined ? [] : tokenizeSearchTerm(searchTerm);

  const emptyResults = {
    universities: [],
    faculties: [],
    studyPrograms: [],
    tracks: [],
    totals: { universities: 0, faculties: 0, studyPrograms: 0, tracks: 0 },
  };

  // A term made up entirely of dropped words can match nothing.
  if (searchTerm !== undefined && tokens.length === 0) {
    sendSuccess(res, {
      message: "Search results retrieved successfully.",
      data: emptyResults,
    });
    return;
  }

  const wanted = (kind: "university" | "faculty" | "studyProgram" | "track") =>
    type === undefined || type.includes(kind);

  const limit = type?.length === 1 ? undefined : FEDERATED_SECTION_LIMIT;

  const cycleFilter = cycle ? { in: cycle } : undefined;

  const emptySection = { items: [], total: 0 };

  const [universities, faculties, studyPrograms, tracks] = await Promise.all([
    wanted("university")
      ? searchSection(
          {
            count: (where) => prisma.university.count({ where }),
            findMany: (where, take) =>
              prisma.university.findMany({
                where,
                ...(take === undefined ? {} : { take }),
                orderBy: [{ ownership: "asc" }, { name: "asc" }],
                include: { _count: { select: { faculties: true } } },
              }),
          },
          tokens,
          universityOwnMatch,
          universityFullMatch,
          [
            ...(entity ? [{ entity }] : []),
            ...(ownership ? [{ ownership }] : []),
          ],
          limit,
        )
      : emptySection,
    wanted("faculty")
      ? searchSection(
          {
            count: (where) => prisma.faculty.count({ where }),
            findMany: (where, take) =>
              prisma.faculty.findMany({
                where,
                ...(take === undefined ? {} : { take }),
                orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
                include: {
                  university: true,
                },
              }),
          },
          tokens,
          facultyOwnMatch,
          facultyFullMatch,
          [
            ...(entity ? [{ university: { entity } }] : []),
            ...(ownership ? [{ university: { ownership } }] : []),
          ],
          limit,
        )
      : emptySection,
    wanted("studyProgram")
      ? searchSection(
          {
            count: (where) => prisma.studyProgram.count({ where }),
            findMany: (where, take) =>
              prisma.studyProgram.findMany({
                where,
                ...(take === undefined ? {} : { take }),
                orderBy: [{ cycle: "asc" }, { name: "asc" }],
                include: {
                  faculty: {
                    include: {
                      university: true,
                    },
                  },
                },
              }),
          },
          tokens,
          studyProgramOwnMatch,
          studyProgramFullMatch,
          [
            ...(cycleFilter ? [{ cycle: cycleFilter }] : []),
            ...(entity ? [{ faculty: { university: { entity } } }] : []),
            ...(ownership ? [{ faculty: { university: { ownership } } }] : []),
          ],
          limit,
        )
      : emptySection,
    wanted("track")
      ? searchSection(
          {
            count: (where) => prisma.track.count({ where }),
            findMany: (where, take) =>
              prisma.track.findMany({
                where,
                ...(take === undefined ? {} : { take }),
                orderBy: [{ studyProgram: { name: "asc" } }, { name: "asc" }],
                include: {
                  studyProgram: {
                    include: {
                      faculty: {
                        include: {
                          university: true,
                        },
                      },
                    },
                  },
                },
              }),
          },
          tokens,
          trackOwnMatch,
          trackFullMatch,
          [
            ...(cycleFilter ? [{ studyProgram: { cycle: cycleFilter } }] : []),
            ...(entity
              ? [{ studyProgram: { faculty: { university: { entity } } } }]
              : []),
            ...(ownership
              ? [
                  {
                    studyProgram: {
                      faculty: { university: { ownership } },
                    },
                  },
                ]
              : []),
          ],
          limit,
        )
      : emptySection,
  ]);

  sendSuccess(res, {
    message: "Search results retrieved successfully.",
    data: {
      universities: universities.items,
      faculties: faculties.items,
      studyPrograms: studyPrograms.items,
      tracks: tracks.items,
      totals: {
        universities: universities.total,
        faculties: faculties.total,
        studyPrograms: studyPrograms.total,
        tracks: tracks.total,
      },
    },
  });
}

async function getFaculties(_req: Request, res: Response) {
  const faculties = await prisma.faculty.findMany({
    orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
    include: { university: true },
  });
  sendSuccess(res, {
    message: "Faculties retrieved successfully.",
    data: faculties,
  });
}

async function getStudyPrograms(_req: Request, res: Response) {
  const studyPrograms = await prisma.studyProgram.findMany({
    orderBy: [{ cycle: "asc" }, { name: "asc" }],
    include: {
      faculty: {
        include: { university: true },
      },
    },
  });
  sendSuccess(res, {
    message: "Study programs retrieved successfully.",
    data: studyPrograms,
  });
}

async function getTracks(_req: Request, res: Response) {
  const tracks = await prisma.track.findMany({
    orderBy: [{ studyProgram: { name: "asc" } }, { name: "asc" }],
    include: {
      studyProgram: {
        include: {
          faculty: {
            include: { university: true },
          },
        },
      },
    },
  });
  sendSuccess(res, {
    message: "Tracks retrieved successfully.",
    data: tracks,
  });
}

async function getUniversityById(req: Request, res: Response) {
  const { id } = universityValidation.getUniversityById(req.params);

  const university = await prisma.university.findUnique({
    where: {
      id,
    },
    include: {
      faculties: {
        orderBy: { name: "asc" },
        include: {
          studyPrograms: {
            orderBy: [{ cycle: "asc" }, { name: "asc" }],
            include: {
              tracks: { orderBy: { name: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!university) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "University not found.",
    });
    return;
  }
  sendSuccess(res, {
    message: "University retrieved successfully.",
    data: university,
  });
}

async function getFacultyById(req: Request, res: Response) {
  const { id } = universityValidation.getFacultyById(req.params);

  const faculty = await prisma.faculty.findUnique({
    where: { id },
    include: {
      university: true,
      studyPrograms: {
        orderBy: [{ cycle: "asc" }, { name: "asc" }],
        include: {
          tracks: { orderBy: { name: "asc" } },
        },
      },
    },
  });
  if (!faculty) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Faculty not found.",
    });
    return;
  }
  sendSuccess(res, {
    message: "Faculty retrieved successfully.",
    data: faculty,
  });
}

async function getStudyProgramById(req: Request, res: Response) {
  const { id } = universityValidation.getStudyProgramById(req.params);

  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id },
    include: {
      faculty: {
        include: { university: true },
      },
      tracks: { orderBy: { name: "asc" } },
    },
  });
  if (!studyProgram) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Study program not found.",
    });
    return;
  }
  sendSuccess(res, {
    message: "Study program retrieved successfully.",
    data: studyProgram,
  });
}

async function getTrackById(req: Request, res: Response) {
  const { id } = universityValidation.getTrackById(req.params);

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      studyProgram: {
        include: {
          faculty: {
            include: { university: true },
          },
        },
      },
    },
  });
  if (!track) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Track not found.",
    });
    return;
  }
  sendSuccess(res, {
    message: "Track retrieved successfully.",
    data: track,
  });
}

export {
  status,
  getUniversities,
  getFaculties,
  getStudyPrograms,
  getTracks,
  search,
  getUniversityById,
  getFacultyById,
  getStudyProgramById,
  getTrackById,
};

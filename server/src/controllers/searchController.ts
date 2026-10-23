import { prisma } from "../db/prisma.js";
import { sendSuccess } from "../utils/response.js";
import { tokenizeSearchTerm } from "../search/tokenize.js";
import {
  universityOwnMatch,
  universityFullMatch,
  facultyOwnMatch,
  facultyFullMatch,
  studyProgramOwnMatch,
  studyProgramFullMatch,
  tokenWhere,
} from "../search/matchers.js";
import * as universityValidation from "../validation/universityValidation.js";

import type { SearchToken } from "../search/tokenize.js";
import type { WhereClause } from "../search/matchers.js";
import type { Request, Response } from "express";

// In the combined (federated) view each section is capped and reports its
// true total; a request for exactly one type returns everything.
const FEDERATED_SECTION_LIMIT = 25;

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
): Promise<{ items: Item[]; total: number; direct: number }> {
  const fullWhere = { AND: [...tokenWhere(tokens, fullMatcher), ...filters] };

  if (tokens.length === 0) {
    const items = await query.findMany(fullWhere, limit);
    const total =
      limit === undefined ? items.length : await query.count(fullWhere);
    return { items, total, direct: items.length };
  }

  const [total, ownItems] = await Promise.all([
    limit === undefined ? undefined : query.count(fullWhere),
    query.findMany(
      { AND: [...tokenWhere(tokens, ownMatcher), ...filters] },
      limit,
    ),
  ]);

  if (limit !== undefined && ownItems.length >= limit) {
    return { items: ownItems, total: total ?? ownItems.length, direct: limit };
  }

  const contextItems = await query.findMany(
    {
      AND: [
        ...tokenWhere(tokens, fullMatcher),
        ...filters,
        { id: { notIn: ownItems.map((item) => item.id) } },
      ],
    },
    limit === undefined ? undefined : limit - ownItems.length,
  );

  const items = [...ownItems, ...contextItems];
  return { items, total: total ?? items.length, direct: ownItems.length };
}

async function search(req: Request, res: Response) {
  const { searchTerm, entity, ownership, cycle, type } =
    universityValidation.searchQuery(req.query);

  const tokens = searchTerm === undefined ? [] : tokenizeSearchTerm(searchTerm);

  const emptyResults = {
    universities: [],
    faculties: [],
    studyPrograms: [],
    totals: { universities: 0, faculties: 0, studyPrograms: 0 },
    direct: { universities: 0, faculties: 0, studyPrograms: 0 },
  };

  // A term made up entirely of dropped words can match nothing.
  if (searchTerm !== undefined && tokens.length === 0) {
    sendSuccess(res, {
      message: "Search results retrieved successfully.",
      data: emptyResults,
    });
    return;
  }

  const wanted = (kind: "university" | "faculty" | "studyProgram") =>
    type === undefined || type.includes(kind);

  const limit = type?.length === 1 ? undefined : FEDERATED_SECTION_LIMIT;

  const cycleFilter = cycle ? { in: cycle } : undefined;

  const emptySection = { items: [], total: 0, direct: 0 };

  const [universities, faculties, studyPrograms] = await Promise.all([
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
                  _count: { select: { studyPrograms: true } },
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
                  tracks: {
                    select: {
                      id: true,
                      name: true,
                      ects: true,
                      durationYears: true,
                    },
                    orderBy: { name: "asc" },
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
  ]);

  sendSuccess(res, {
    message: "Search results retrieved successfully.",
    data: {
      universities: universities.items,
      faculties: faculties.items,
      studyPrograms: studyPrograms.items,
      totals: {
        universities: universities.total,
        faculties: faculties.total,
        studyPrograms: studyPrograms.total,
      },
      // items are ordered own-field matches first; these counts mark the
      // split so the client can flag context-only matches and rank sections
      direct: {
        universities: universities.direct,
        faculties: faculties.direct,
        studyPrograms: studyPrograms.direct,
      },
    },
  });
}

export { search };

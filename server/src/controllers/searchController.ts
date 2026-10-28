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
import * as v1Validation from "../validation/v1Validation.js";

import type { SearchToken } from "../search/tokenize.js";
import type { WhereClause } from "../search/matchers.js";
import type { Request, Response } from "express";

interface SectionQuery<Item> {
  findMany: (where: WhereClause) => Promise<Item[]>;
}

// Entities matching every token in their OWN fields come first; context-only
// matches follow, so the client can rank sections and flag weak matches.
async function searchSection<Item extends { id: number }>(
  query: SectionQuery<Item>,
  tokens: SearchToken[],
  ownMatcher: (token: SearchToken) => WhereClause[],
  fullMatcher: (token: SearchToken) => WhereClause[],
  filters: WhereClause[],
): Promise<{ items: Item[]; direct: number }> {
  if (tokens.length === 0) {
    const items = await query.findMany({ AND: filters });
    return { items, direct: items.length };
  }

  const ownItems = await query.findMany({
    AND: [...tokenWhere(tokens, ownMatcher), ...filters],
  });

  const contextItems = await query.findMany({
    AND: [
      ...tokenWhere(tokens, fullMatcher),
      ...filters,
      { id: { notIn: ownItems.map((item) => item.id) } },
    ],
  });

  return { items: [...ownItems, ...contextItems], direct: ownItems.length };
}

async function search(req: Request, res: Response) {
  const { searchTerm, country, entity, ownership, cycle, type } =
    v1Validation.searchQuery(req.query);

  const tokens = searchTerm === undefined ? [] : tokenizeSearchTerm(searchTerm);

  const emptyResults = {
    universities: [],
    faculties: [],
    studyPrograms: [],
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

  const cycleFilter = cycle ? { in: cycle } : undefined;

  const emptySection = { items: [], direct: 0 };

  const [universities, faculties, studyPrograms] = await Promise.all([
    wanted("university")
      ? searchSection(
          {
            findMany: (where) =>
              prisma.university.findMany({
                where,
                orderBy: [{ country: "asc" }, { ownership: "asc" }, { name: "asc" }],
                include: { _count: { select: { faculties: true } } },
              }),
          },
          tokens,
          universityOwnMatch,
          universityFullMatch,
          [
            ...(country ? [{ country }] : []),
            ...(entity ? [{ entity }] : []),
            ...(ownership ? [{ ownership }] : []),
          ],
        )
      : emptySection,
    wanted("faculty")
      ? searchSection(
          {
            findMany: (where) =>
              prisma.faculty.findMany({
                where,
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
            ...(country ? [{ university: { country } }] : []),
            ...(entity ? [{ university: { entity } }] : []),
            ...(ownership ? [{ university: { ownership } }] : []),
          ],
        )
      : emptySection,
    wanted("studyProgram")
      ? searchSection(
          {
            findMany: (where) =>
              prisma.studyProgram.findMany({
                where,
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
            ...(country ? [{ faculty: { university: { country } } }] : []),
            ...(entity ? [{ faculty: { university: { entity } } }] : []),
            ...(ownership ? [{ faculty: { university: { ownership } } }] : []),
          ],
        )
      : emptySection,
  ]);

  sendSuccess(res, {
    message: "Search results retrieved successfully.",
    data: {
      universities: universities.items,
      faculties: faculties.items,
      studyPrograms: studyPrograms.items,
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

import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { expandSearchTerm } from "../utils/searchVariants.js";

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

async function search(req: Request, res: Response) {
  const { searchTerm } = universityValidation.searchQuery(req.query);

  // Match any accent variant of the term (e.g. "dzemal" also finds "Džemal").
  const variants = expandSearchTerm(searchTerm);

  const textContains = (field: string) =>
    variants.map((variant) => ({
      [field]: { contains: variant, mode: "insensitive" as const },
    }));

  const relationContains = (relation: string, field: string) =>
    variants.map((variant) => ({
      [relation]: {
        [field]: { contains: variant, mode: "insensitive" as const },
      },
    }));

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

  // Exact match against an enum (enums don't support `contains`).
  // Returns a condition array: one element if matched, empty otherwise.
  function enumMatch<T extends string>(
    field: string,
    values: readonly T[],
  ): Record<string, T>[] {
    const upper = searchTerm.toUpperCase();
    const candidate = ENUM_ALIASES[upper] ?? upper;
    const match = values.find((v) => v === candidate);
    return match ? [{ [field]: match }] : [];
  }

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

  const [universities, faculties, studyPrograms, tracks] = await Promise.all([
    prisma.university.findMany({
      where: {
        OR: [
          ...textContains("name"),
          ...textContains("city"),
          ...textContains("acronym"),
          ...enumMatch("entity", ENTITIES),
          ...enumMatch("ownership", OWNERSHIPS),
        ],
      },
      orderBy: [{ ownership: "asc" }, { name: "asc" }],
      include: { _count: { select: { faculties: true } } },
    }),
    prisma.faculty.findMany({
      where: {
        OR: [
          ...textContains("name"),
          ...textContains("city"),
          ...relationContains("university", "name"),
        ],
      },
      orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
      include: {
        university: true,
      },
    }),
    prisma.studyProgram.findMany({
      where: {
        OR: [
          ...textContains("name"),
          ...textContains("language"),
          ...relationContains("faculty", "name"),
          ...enumMatch("cycle", CYCLES),
        ],
      },
      orderBy: [{ cycle: "asc" }, { name: "asc" }],
      include: {
        faculty: {
          include: {
            university: true,
          },
        },
      },
    }),
    prisma.track.findMany({
      where: {
        OR: [
          ...textContains("name"),
          ...relationContains("studyProgram", "name"),
        ],
      },
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
  ]);

  const totalResults =
    universities.length +
    faculties.length +
    studyPrograms.length +
    tracks.length;

  if (totalResults > 0) {
    sendSuccess(res, {
      message: "Search results retrieved successfully.",
      data: { universities, faculties, studyPrograms, tracks },
    });
    return;
  }

  sendError(res, {
    status: 404,
    message: "No results found matching your search.",
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
      message: "University not found.",
    });
    return;
  }
  sendSuccess(res, {
    message: "University retrieved successfully.",
    data: university,
  });
}

export { status, getUniversities, search, getUniversityById };

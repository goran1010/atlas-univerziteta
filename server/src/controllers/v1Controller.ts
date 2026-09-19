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
  const { searchTerm, entity, ownership, cycle } =
    universityValidation.searchQuery(req.query);

  const hasText = searchTerm !== undefined;

  const variants = hasText ? expandSearchTerm(searchTerm) : [];

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

  function enumMatch<T extends string>(
    field: string,
    values: readonly T[],
  ): Record<string, T>[] {
    if (!hasText) return [];
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

  const cycleFilter = cycle ? { in: cycle } : undefined;

  // When there's a text query, results must match the text OR an enum alias,
  // then get narrowed by any active filters. When there's no text query
  // (filter-only browse), skip the text OR clause entirely.
  function withTextMatch(orClauses: Record<string, unknown>[]) {
    if (!hasText) return [];
    return [{ OR: orClauses }];
  }

  const [universities, faculties, studyPrograms, tracks] = await Promise.all([
    prisma.university.findMany({
      where: {
        AND: [
          ...withTextMatch([
            ...textContains("name"),
            ...textContains("city"),
            ...textContains("acronym"),
            ...enumMatch("entity", ENTITIES),
            ...enumMatch("ownership", OWNERSHIPS),
          ]),
          ...(entity ? [{ entity }] : []),
          ...(ownership ? [{ ownership }] : []),
        ],
      },
      orderBy: [{ ownership: "asc" }, { name: "asc" }],
      include: { _count: { select: { faculties: true } } },
    }),
    prisma.faculty.findMany({
      where: {
        AND: [
          ...withTextMatch([
            ...textContains("name"),
            ...textContains("city"),
            ...relationContains("university", "name"),
          ]),
          ...(entity ? [{ university: { entity } }] : []),
          ...(ownership ? [{ university: { ownership } }] : []),
        ],
      },
      orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
      include: {
        university: true,
      },
    }),
    prisma.studyProgram.findMany({
      where: {
        AND: [
          ...withTextMatch([
            ...textContains("name"),
            ...textContains("language"),
            ...relationContains("faculty", "name"),
            ...enumMatch("cycle", CYCLES),
          ]),
          ...(cycleFilter ? [{ cycle: cycleFilter }] : []),
          ...(entity ? [{ faculty: { university: { entity } } }] : []),
          ...(ownership ? [{ faculty: { university: { ownership } } }] : []),
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
        AND: [
          ...withTextMatch([
            ...textContains("name"),
            ...relationContains("studyProgram", "name"),
          ]),
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
    code: "NOT_FOUND",
    message: "No results found matching your search.",
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

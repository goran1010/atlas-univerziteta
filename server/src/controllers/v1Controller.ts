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
  const fieldContains = (field: "name" | "city" | "acronym") =>
    variants.map((variant) => ({
      [field]: { contains: variant, mode: "insensitive" as const },
    }));

  const [universities, faculties, studyPrograms, subjects, tracks] =
    await Promise.all([
      prisma.university.findMany({
        where: {
          OR: [
            ...fieldContains("name"),
            ...fieldContains("city"),
            ...fieldContains("acronym"),
          ],
        },
        include: { _count: { select: { faculties: true } } },
      }),
      prisma.faculty.findMany({
        where: {
          OR: [...fieldContains("name"), ...fieldContains("city")],
        },
        include: {
          university: true,
        },
      }),
      prisma.studyProgram.findMany({
        where: {
          OR: fieldContains("name"),
        },
        include: {
          faculty: {
            include: {
              university: true,
            },
          },
        },
      }),
      prisma.subject.findMany({
        where: {
          OR: fieldContains("name"),
        },
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
      prisma.track.findMany({
        where: {
          OR: fieldContains("name"),
        },
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
    subjects.length +
    tracks.length;

  if (totalResults > 0) {
    sendSuccess(res, {
      message: "Search results retrieved successfully.",
      data: { universities, faculties, studyPrograms, tracks, subjects },
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
        include: {
          studyPrograms: {
            include: {
              subjects: true,
              tracks: true,
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

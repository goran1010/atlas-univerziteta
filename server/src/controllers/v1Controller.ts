import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";

import type { Request, Response } from "express";
import * as v1Validation from "../validation/v1Validation.js";

function status(_req: Request, res: Response) {
  sendSuccess(res, {
    data: {
      status: "ok",
    },
    message: "API v1 server is running",
  });
}

// List endpoints are a paginated directory: the entity's public fields plus
// a minimal parent reference. The full records live on the by-id endpoints.
function pagination(page: number, limit: number, total: number) {
  return { page, totalPages: Math.max(1, Math.ceil(total / limit)), total };
}

async function getUniversities(req: Request, res: Response) {
  const { page, limit } = v1Validation.listQuery(req.query);

  const [total, universities] = await Promise.all([
    prisma.university.count(),
    prisma.university.findMany({
      orderBy: [{ ownership: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        acronym: true,
        city: true,
        entity: true,
        ownership: true,
        foundedYear: true,
        website: true,
        _count: { select: { faculties: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  sendSuccess(res, {
    message: "Universities retrieved successfully.",
    data: universities,
    pagination: pagination(page, limit, total),
  });
}

async function getFaculties(req: Request, res: Response) {
  const { page, limit } = v1Validation.listQuery(req.query);

  const [total, faculties] = await Promise.all([
    prisma.faculty.count(),
    prisma.faculty.findMany({
      orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        city: true,
        website: true,
        university: { select: { id: true, name: true, acronym: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  sendSuccess(res, {
    message: "Faculties retrieved successfully.",
    data: faculties,
    pagination: pagination(page, limit, total),
  });
}

async function getStudyPrograms(req: Request, res: Response) {
  const { page, limit } = v1Validation.listQuery(req.query);

  const [total, studyPrograms] = await Promise.all([
    prisma.studyProgram.count(),
    prisma.studyProgram.findMany({
      orderBy: [{ cycle: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        cycle: true,
        durationYears: true,
        ects: true,
        language: true,
        faculty: {
          select: {
            id: true,
            name: true,
            university: { select: { id: true, name: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  sendSuccess(res, {
    message: "Study programs retrieved successfully.",
    data: studyPrograms,
    pagination: pagination(page, limit, total),
  });
}

async function getTracks(req: Request, res: Response) {
  const { page, limit } = v1Validation.listQuery(req.query);

  const [total, tracks] = await Promise.all([
    prisma.track.count(),
    prisma.track.findMany({
      orderBy: [{ studyProgram: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        ects: true,
        durationYears: true,
        studyProgram: {
          select: {
            id: true,
            name: true,
            faculty: {
              select: {
                id: true,
                name: true,
                university: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  sendSuccess(res, {
    message: "Tracks retrieved successfully.",
    data: tracks,
    pagination: pagination(page, limit, total),
  });
}

async function getUniversityById(req: Request, res: Response) {
  const { id } = v1Validation.getUniversityById(req.params);

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
  const { id } = v1Validation.getFacultyById(req.params);

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
  const { id } = v1Validation.getStudyProgramById(req.params);

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
  const { id } = v1Validation.getTrackById(req.params);

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
  getUniversityById,
  getFacultyById,
  getStudyProgramById,
  getTrackById,
};

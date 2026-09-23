import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";

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
  getUniversityById,
  getFacultyById,
  getStudyProgramById,
  getTrackById,
};

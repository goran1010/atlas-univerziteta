import {
  universitySearchFields,
  facultySearchFields,
  studyProgramSearchFields,
  trackSearchFields,
} from "../../src/search/fields.js";

import type { Prisma } from "../../src/generated/prisma/client.js";

// Test fixtures write entities with bare prisma calls, which bypasses the
// app-level folding in pendingChangeInputs.ts - and rows without folded
// search* values are invisible to search. Wrapping a university create
// `data` (including nested faculties/studyPrograms/tracks) fills them in.

interface TrackFixture {
  name: string;
  ects?: number | null;
  durationYears?: number | null;
}

interface StudyProgramFixture {
  name: string;
  cycle: Prisma.StudyProgramCreateInput["cycle"];
  language?: string | null;
  ects?: number | null;
  durationYears?: number | null;
  tracks?: { create: TrackFixture | TrackFixture[] };
}

interface FacultyFixture {
  name: string;
  city?: string | null;
  studyPrograms?: { create: StudyProgramFixture | StudyProgramFixture[] };
}

interface UniversityFixture {
  name: string;
  city: string;
  country?: Prisma.UniversityCreateInput["country"];
  entity?: Prisma.UniversityCreateInput["entity"];
  ownership: Prisma.UniversityCreateInput["ownership"];
  acronym?: string | null;
  foundedYear?: string | null;
  faculties?: { create: FacultyFixture | FacultyFixture[] };
}

function mapOne<T>(value: T | T[], fold: (item: T) => T): T | T[] {
  return Array.isArray(value) ? value.map(fold) : fold(value);
}

function foldTrackFixture(track: TrackFixture) {
  return { ...track, ...trackSearchFields(track) };
}

function foldStudyProgramFixture(program: StudyProgramFixture) {
  return {
    ...program,
    ...studyProgramSearchFields(program),
    ...(program.tracks && {
      tracks: { create: mapOne(program.tracks.create, foldTrackFixture) },
    }),
  };
}

function foldFacultyFixture(faculty: FacultyFixture) {
  return {
    ...faculty,
    ...facultySearchFields(faculty),
    ...(faculty.studyPrograms && {
      studyPrograms: {
        create: mapOne(faculty.studyPrograms.create, foldStudyProgramFixture),
      },
    }),
  };
}

function foldUniversityFixture(university: UniversityFixture) {
  return {
    country: "BIH" as const,
    ...university,
    entity: university.entity ?? null,
    ...universitySearchFields(university),
    ...(university.faculties && {
      faculties: {
        create: mapOne(university.faculties.create, foldFacultyFixture),
      },
    }),
  };
}

export { foldUniversityFixture };

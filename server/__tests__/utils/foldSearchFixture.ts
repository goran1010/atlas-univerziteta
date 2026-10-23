import {
  foldSearchText,
  foldSearchTextOrNull,
} from "../../src/utils/searchText.js";

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
  entity: Prisma.UniversityCreateInput["entity"];
  ownership: Prisma.UniversityCreateInput["ownership"];
  acronym?: string | null;
  foundedYear?: string | null;
  faculties?: { create: FacultyFixture | FacultyFixture[] };
}

function mapOne<T>(value: T | T[], fold: (item: T) => T): T | T[] {
  return Array.isArray(value) ? value.map(fold) : fold(value);
}

function foldTrackFixture(track: TrackFixture) {
  return { ...track, searchName: foldSearchText(track.name) };
}

function foldStudyProgramFixture(program: StudyProgramFixture) {
  return {
    ...program,
    searchName: foldSearchText(program.name),
    searchLanguage: foldSearchTextOrNull(program.language ?? null),
    ...(program.tracks && {
      tracks: { create: mapOne(program.tracks.create, foldTrackFixture) },
    }),
  };
}

function foldFacultyFixture(faculty: FacultyFixture) {
  return {
    ...faculty,
    searchName: foldSearchText(faculty.name),
    searchCity: foldSearchTextOrNull(faculty.city ?? null),
    ...(faculty.studyPrograms && {
      studyPrograms: {
        create: mapOne(faculty.studyPrograms.create, foldStudyProgramFixture),
      },
    }),
  };
}

function foldUniversityFixture(university: UniversityFixture) {
  return {
    ...university,
    searchName: foldSearchText(university.name),
    searchCity: foldSearchText(university.city),
    searchAcronym: foldSearchTextOrNull(university.acronym ?? null),
    ...(university.faculties && {
      faculties: {
        create: mapOne(university.faculties.create, foldFacultyFixture),
      },
    }),
  };
}

export { foldUniversityFixture };

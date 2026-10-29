import {
  universitySearchFields,
  facultySearchFields,
  studyProgramSearchFields,
  trackSearchFields,
} from "../search/fields.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  FacultyCreateData,
  FacultyEditData,
  FacultyTreeData,
  StudyProgramCreateData,
  StudyProgramEditData,
  StudyProgramTreeData,
  TrackCreateData,
  TrackEditData,
  UniversityCreateData,
  UniversityEditData,
  UniversityTreeData,
} from "../validation/contributionValidation.js";

// Pure mapping from validated pending-change payloads to Prisma inputs -
// the approval transaction itself lives in applyPendingChange.ts. The spread
// *SearchFields helpers store the folded search* copy of every searchable
// field that is present.
//
// The *CreateFields helpers map one node without its parent id, so the tree
// mappers can nest them under `{ create: [...] }` and Prisma fills in the
// foreign keys while creating the whole subtree in one statement.
function toUniversityCreateInput(
  data: UniversityCreateData,
): Prisma.UniversityCreateInput {
  return {
    lastModified: new Date(),
    name: data.name,
    city: data.city,
    country: data.country,
    entity: data.entity ?? null,
    ownership: data.ownership,
    ...(data.acronym !== undefined && { acronym: data.acronym }),
    ...(data.foundedYear !== undefined && { foundedYear: data.foundedYear }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
    ...universitySearchFields(data),
  };
}

function toUniversityUpdateInput(
  data: UniversityEditData,
): Prisma.UniversityUpdateInput {
  return {
    lastModified: new Date(),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.city !== undefined && { city: data.city }),
    ...(data.country !== undefined && { country: data.country }),
    ...(data.entity !== undefined && { entity: data.entity }),
    ...(data.ownership !== undefined && { ownership: data.ownership }),
    ...(data.acronym !== undefined && { acronym: data.acronym }),
    ...(data.foundedYear !== undefined && { foundedYear: data.foundedYear }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
    ...universitySearchFields(data),
  };
}

function toFacultyCreateFields(
  data: FacultyCreateData,
): Prisma.FacultyCreateWithoutUniversityInput {
  return {
    lastModified: new Date(),
    name: data.name,
    ...(data.city !== undefined && { city: data.city }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
    ...facultySearchFields(data),
  };
}

function toFacultyUpdateInput(
  data: FacultyEditData,
): Prisma.FacultyUpdateInput {
  return {
    lastModified: new Date(),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.city !== undefined && { city: data.city }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
    ...facultySearchFields(data),
  };
}

function toStudyProgramCreateFields(
  data: StudyProgramCreateData,
): Prisma.StudyProgramCreateWithoutFacultyInput {
  return {
    lastModified: new Date(),
    name: data.name,
    cycle: data.cycle,
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.language !== undefined && { language: data.language }),
    ...studyProgramSearchFields(data),
  };
}

function toStudyProgramUpdateInput(
  data: StudyProgramEditData,
): Prisma.StudyProgramUpdateInput {
  return {
    lastModified: new Date(),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.cycle !== undefined && { cycle: data.cycle }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.language !== undefined && { language: data.language }),
    ...studyProgramSearchFields(data),
  };
}

function toTrackCreateFields(
  data: TrackCreateData,
): Prisma.TrackCreateWithoutStudyProgramInput {
  return {
    lastModified: new Date(),
    name: data.name,
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...trackSearchFields(data),
  };
}

function toTrackCreateInput(
  data: TrackCreateData,
  studyProgramId: number,
): Prisma.TrackUncheckedCreateInput {
  return { ...toTrackCreateFields(data), studyProgramId };
}

function toStudyProgramTreeCreateFields(
  data: StudyProgramTreeData,
): Prisma.StudyProgramCreateWithoutFacultyInput {
  const { tracks, ...fields } = data;
  return {
    ...toStudyProgramCreateFields(fields),
    ...(tracks !== undefined && {
      tracks: { create: tracks.map(toTrackCreateFields) },
    }),
  };
}

function toStudyProgramTreeCreateInput(
  data: StudyProgramTreeData,
  facultyId: number,
): Prisma.StudyProgramUncheckedCreateInput {
  return { ...toStudyProgramTreeCreateFields(data), facultyId };
}

function toFacultyTreeCreateFields(
  data: FacultyTreeData,
): Prisma.FacultyCreateWithoutUniversityInput {
  const { studyPrograms, ...fields } = data;
  return {
    ...toFacultyCreateFields(fields),
    ...(studyPrograms !== undefined && {
      studyPrograms: {
        create: studyPrograms.map(toStudyProgramTreeCreateFields),
      },
    }),
  };
}

function toFacultyTreeCreateInput(
  data: FacultyTreeData,
  universityId: number,
): Prisma.FacultyUncheckedCreateInput {
  return { ...toFacultyTreeCreateFields(data), universityId };
}

function toUniversityTreeCreateInput(
  data: UniversityTreeData,
): Prisma.UniversityCreateInput {
  const { faculties, ...fields } = data;
  return {
    ...toUniversityCreateInput(fields),
    ...(faculties !== undefined && {
      faculties: { create: faculties.map(toFacultyTreeCreateFields) },
    }),
  };
}

function toTrackUpdateInput(data: TrackEditData): Prisma.TrackUpdateInput {
  return {
    lastModified: new Date(),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...trackSearchFields(data),
  };
}

export {
  toUniversityTreeCreateInput,
  toUniversityUpdateInput,
  toFacultyTreeCreateInput,
  toFacultyUpdateInput,
  toStudyProgramTreeCreateInput,
  toStudyProgramUpdateInput,
  toTrackCreateInput,
  toTrackUpdateInput,
};

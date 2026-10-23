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
  StudyProgramCreateData,
  StudyProgramEditData,
  TrackCreateData,
  TrackEditData,
  UniversityCreateData,
  UniversityEditData,
} from "../validation/contributionValidation.js";

// Pure mapping from validated pending-change payloads to Prisma inputs -
// the approval transaction itself lives in transactionModel.ts. The spread
// *SearchFields helpers store the folded search* copy of every searchable
// field that is present.
function toUniversityCreateInput(
  data: UniversityCreateData,
): Prisma.UniversityCreateInput {
  return {
    lastModified: new Date(),
    name: data.name,
    city: data.city,
    entity: data.entity,
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

function toFacultyCreateInput(
  data: FacultyCreateData,
  universityId: number,
): Prisma.FacultyUncheckedCreateInput {
  return {
    lastModified: new Date(),
    name: data.name,
    universityId,
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

function toStudyProgramCreateInput(
  data: StudyProgramCreateData,
  facultyId: number,
): Prisma.StudyProgramUncheckedCreateInput {
  return {
    lastModified: new Date(),
    name: data.name,
    cycle: data.cycle,
    facultyId,
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

function toTrackCreateInput(
  data: TrackCreateData,
  studyProgramId: number,
): Prisma.TrackUncheckedCreateInput {
  return {
    lastModified: new Date(),
    name: data.name,
    studyProgramId,
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...trackSearchFields(data),
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
  toUniversityCreateInput,
  toUniversityUpdateInput,
  toFacultyCreateInput,
  toFacultyUpdateInput,
  toStudyProgramCreateInput,
  toStudyProgramUpdateInput,
  toTrackCreateInput,
  toTrackUpdateInput,
};

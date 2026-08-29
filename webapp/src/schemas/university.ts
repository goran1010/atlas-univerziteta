import { z } from "zod";

import {
  durationYearsSchema,
  ectsSchema,
  entitySchema,
  ownershipSchema,
  positiveIntegerSchema,
  studyCycleSchema,
} from "./domain";

const optionalTextSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

const universitySchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  acronym: optionalTextSchema,
  city: z.string().min(1),
  entity: entitySchema,
  ownership: ownershipSchema,
  foundedYear: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  accreditationFrom: optionalTextSchema,
  accreditationTo: optionalTextSchema,
  authority: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
});

const trackSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  studyProgramId: positiveIntegerSchema,
  ects: ectsSchema.nullish().transform((value) => value ?? undefined),
  durationYears: durationYearsSchema
    .nullish()
    .transform((value) => value ?? undefined),
  sourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
});

const studyProgramSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  facultyId: positiveIntegerSchema,
  cycle: studyCycleSchema,
  durationYears: durationYearsSchema
    .nullish()
    .transform((value) => value ?? undefined),
  ects: ectsSchema.nullish().transform((value) => value ?? undefined),
  language: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
  tracks: z.array(trackSchema).optional().default([]),
});

const facultySchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  universityId: positiveIntegerSchema,
  city: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
  studyPrograms: z.array(studyProgramSchema),
});

const universityListItemSchema = universitySchema.extend({
  _count: z
    .object({ faculties: z.number() })
    .optional()
    .default({ faculties: 0 }),
});

const universityDetailSchema = universitySchema.extend({
  faculties: z.array(facultySchema),
});

const universityListResponseSchema = z.object({
  message: z.string(),
  data: z.array(universityListItemSchema),
});

const universityDetailResponseSchema = z.object({
  message: z.string(),
  data: universityDetailSchema,
});

const searchResultUniversitySchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  acronym: optionalTextSchema,
  city: z.string().min(1),
});

const studyProgramSearchResultSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  facultyId: positiveIntegerSchema,
  cycle: studyCycleSchema,
  ects: ectsSchema.nullish().transform((value) => value ?? undefined),
  faculty: z.object({
    id: positiveIntegerSchema,
    name: z.string().min(1),
    universityId: positiveIntegerSchema,
    university: searchResultUniversitySchema,
  }),
});

const facultySearchResultSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  universityId: positiveIntegerSchema,
  city: optionalTextSchema,
  website: optionalTextSchema,
  university: searchResultUniversitySchema,
});

const trackSearchResultSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  studyProgramId: positiveIntegerSchema,
  ects: ectsSchema.nullish().transform((value) => value ?? undefined),
  durationYears: durationYearsSchema
    .nullish()
    .transform((value) => value ?? undefined),
  studyProgram: z.object({
    id: positiveIntegerSchema,
    name: z.string().min(1),
    cycle: studyCycleSchema,
    faculty: z.object({
      id: positiveIntegerSchema,
      name: z.string().min(1),
      universityId: positiveIntegerSchema,
      university: searchResultUniversitySchema,
    }),
  }),
});

const unifiedSearchResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    universities: z.array(universityListItemSchema),
    faculties: z.array(facultySearchResultSchema),
    studyPrograms: z.array(studyProgramSearchResultSchema),
    tracks: z.array(trackSearchResultSchema).optional().default([]),
  }),
});

export type UniversityDetail = z.infer<typeof universityDetailSchema>;
export type UniversityListItem = z.infer<typeof universityListItemSchema>;
export type UniversityDetailFaculty = UniversityDetail["faculties"][number];
export type UniversityDetailStudyProgram =
  UniversityDetailFaculty["studyPrograms"][number];
export type UniversityDetailTrack =
  UniversityDetailStudyProgram["tracks"][number];
export type StudyProgramSearchResult = z.infer<
  typeof studyProgramSearchResultSchema
>;
export type FacultySearchResult = z.infer<typeof facultySearchResultSchema>;
export type TrackSearchResult = z.infer<typeof trackSearchResultSchema>;
export type UnifiedSearchResults = z.infer<
  typeof unifiedSearchResponseSchema
>["data"];
export {
  unifiedSearchResponseSchema,
  universityDetailResponseSchema,
  universityListResponseSchema,
};

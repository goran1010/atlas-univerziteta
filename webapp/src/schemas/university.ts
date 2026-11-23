import { z } from "zod";

import {
  countrySchema,
  entitySchema,
  integerSchema,
  ownershipSchema,
  positiveIntegerSchema,
  studyCycleSchema,
} from "./domain";

// Response schemas check types only. Input rules (non-empty names, 1-10
// years, positive ECTS) stay with the contribution form, server validation
// and seed: on read, one stored value outside them would fail the whole
// response and hide every result in it.
const optionalTextSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

const optionalIntegerSchema = integerSchema
  .nullish()
  .transform((value) => value ?? undefined);

const universitySchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  acronym: optionalTextSchema,
  city: z.string(),
  country: countrySchema,
  entity: entitySchema.nullish().transform((value) => value ?? undefined),
  ownership: ownershipSchema,
  foundedYear: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  accreditationFrom: optionalTextSchema,
  accreditationTo: optionalTextSchema,
  authority: optionalTextSchema,
  dataSourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
});

const trackSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  studyProgramId: positiveIntegerSchema,
  ects: optionalIntegerSchema,
  durationYears: optionalIntegerSchema,
  dataSourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
});

const studyProgramSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  facultyId: positiveIntegerSchema,
  cycle: studyCycleSchema,
  durationYears: optionalIntegerSchema,
  ects: optionalIntegerSchema,
  language: optionalTextSchema,
  dataSourceUrl: optionalTextSchema,
  lastModified: optionalTextSchema,
  tracks: z.array(trackSchema).optional().default([]),
});

const facultySchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  universityId: positiveIntegerSchema,
  city: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  dataSourceUrl: optionalTextSchema,
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
  page: z.number(),
  totalPages: z.number(),
  total: z.number(),
});

const universityDetailResponseSchema = z.object({
  message: z.string(),
  data: universityDetailSchema,
});

const searchResultUniversitySchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  acronym: optionalTextSchema,
  city: z.string(),
  country: countrySchema,
  entity: entitySchema.nullish().transform((value) => value ?? undefined),
  ownership: ownershipSchema,
});

const studyProgramSearchResultSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  facultyId: positiveIntegerSchema,
  cycle: studyCycleSchema,
  ects: optionalIntegerSchema,
  durationYears: optionalIntegerSchema,
  tracks: z
    .array(
      z.object({
        id: positiveIntegerSchema,
        name: z.string(),
        ects: optionalIntegerSchema,
        durationYears: optionalIntegerSchema,
      }),
    )
    .optional()
    .default([]),
  faculty: z.object({
    id: positiveIntegerSchema,
    name: z.string(),
    universityId: positiveIntegerSchema,
    university: searchResultUniversitySchema,
  }),
});

const facultySearchResultSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string(),
  universityId: positiveIntegerSchema,
  city: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  _count: z.object({ studyPrograms: integerSchema.nonnegative() }).optional(),
  university: searchResultUniversitySchema,
});

const unifiedSearchResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    universities: z.array(universityListItemSchema),
    faculties: z.array(facultySearchResultSchema),
    studyPrograms: z.array(studyProgramSearchResultSchema),
    direct: z
      .object({
        universities: z.number().int().nonnegative(),
        faculties: z.number().int().nonnegative(),
        studyPrograms: z.number().int().nonnegative(),
      })
      .optional(),
  }),
});

const facultyDetailSchema = facultySchema.extend({
  university: universitySchema,
});

const facultyDetailResponseSchema = z.object({
  message: z.string(),
  data: facultyDetailSchema,
});

const studyProgramDetailResponseSchema = z.object({
  message: z.string(),
  data: studyProgramSchema,
});

const trackDetailResponseSchema = z.object({
  message: z.string(),
  data: trackSchema,
});

export type FacultyDetail = z.infer<typeof facultyDetailSchema>;
export type StudyProgramDetail = z.infer<typeof studyProgramSchema>;
export type TrackDetail = z.infer<typeof trackSchema>;
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
export type UnifiedSearchResults = z.infer<
  typeof unifiedSearchResponseSchema
>["data"];
export {
  unifiedSearchResponseSchema,
  universityDetailResponseSchema,
  universityListResponseSchema,
  facultyDetailResponseSchema,
  studyProgramDetailResponseSchema,
  trackDetailResponseSchema,
};

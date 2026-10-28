import { z } from "zod";

import {
  countrySchema,
  durationYearsSchema,
  ectsSchema,
  entitySchema,
  integerSchema,
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
  name: z.string().min(1),
  studyProgramId: positiveIntegerSchema,
  ects: ectsSchema.nullish().transform((value) => value ?? undefined),
  durationYears: durationYearsSchema
    .nullish()
    .transform((value) => value ?? undefined),
  dataSourceUrl: optionalTextSchema,
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
  dataSourceUrl: optionalTextSchema,
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
  name: z.string().min(1),
  acronym: optionalTextSchema,
  city: z.string().min(1),
  country: countrySchema,
  entity: entitySchema.nullish().transform((value) => value ?? undefined),
  ownership: ownershipSchema,
});

const studyProgramSearchResultSchema = z.object({
  id: positiveIntegerSchema,
  name: z.string().min(1),
  facultyId: positiveIntegerSchema,
  cycle: studyCycleSchema,
  ects: ectsSchema.nullish().transform((value) => value ?? undefined),
  durationYears: durationYearsSchema
    .nullish()
    .transform((value) => value ?? undefined),
  tracks: z
    .array(
      z.object({
        id: positiveIntegerSchema,
        name: z.string().min(1),
        ects: ectsSchema.nullish().transform((value) => value ?? undefined),
        durationYears: durationYearsSchema
          .nullish()
          .transform((value) => value ?? undefined),
      }),
    )
    .optional()
    .default([]),
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

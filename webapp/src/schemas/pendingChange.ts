import { z } from "zod";

import {
  countrySchema,
  entitySchema,
  integerSchema,
  ownershipSchema,
  positiveIntegerSchema,
  studyCycleSchema,
  targetTypeSchema,
  userRoleSchema,
} from "./domain";

// Stored suggestions are read with types only, not the contribution input
// rules in contribution.ts: a suggestion saved before a rule got stricter
// would otherwise fail the whole list it is in.

const trackCreateReadSchema = z.object({
  name: z.string(),
  ects: integerSchema.optional(),
  durationYears: integerSchema.optional(),
});

const studyProgramTreeReadSchema = z.object({
  name: z.string(),
  cycle: studyCycleSchema,
  durationYears: integerSchema.optional(),
  ects: integerSchema.optional(),
  language: z.string().optional(),
  tracks: z.array(trackCreateReadSchema).optional(),
});

const facultyTreeReadSchema = z.object({
  name: z.string(),
  city: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  studyPrograms: z.array(studyProgramTreeReadSchema).optional(),
});

const universityTreeReadSchema = z.object({
  name: z.string(),
  city: z.string(),
  country: countrySchema,
  entity: entitySchema.optional(),
  ownership: ownershipSchema,
  acronym: z.string().optional(),
  foundedYear: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  faculties: z.array(facultyTreeReadSchema).optional(),
});

const trackEditReadSchema = z.object({
  name: z.string().optional(),
  ects: integerSchema.nullable().optional(),
  durationYears: integerSchema.nullable().optional(),
});

const studyProgramEditReadSchema = z.object({
  name: z.string().optional(),
  cycle: studyCycleSchema.optional(),
  durationYears: integerSchema.nullable().optional(),
  ects: integerSchema.nullable().optional(),
  language: z.string().nullable().optional(),
});

const facultyEditReadSchema = z.object({
  name: z.string().optional(),
  city: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

const universityEditReadSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  country: countrySchema.optional(),
  entity: entitySchema.nullable().optional(),
  ownership: ownershipSchema.optional(),
  acronym: z.string().nullable().optional(),
  foundedYear: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

const pendingChangeUserSchema = z
  .object({
    email: z.string(),
    role: userRoleSchema,
  })
  .loose();

const pendingChangeBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  user: pendingChangeUserSchema.nullable().optional(),
  createdAt: z.coerce.date(),
  comment: z.string().nullable().optional(),
});

const pendingChangeSchema = z.union([
  pendingChangeBaseSchema.extend({
    targetType: z.literal("UNIVERSITY"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: z.null(),
    data: universityTreeReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: positiveIntegerSchema,
    data: facultyTreeReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: positiveIntegerSchema,
    data: studyProgramTreeReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("TRACK"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: positiveIntegerSchema,
    data: trackCreateReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("UNIVERSITY"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: universityEditReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: facultyEditReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: studyProgramEditReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("TRACK"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: trackEditReadSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: targetTypeSchema,
    typeOfChange: z.literal("DELETE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: z.object({}),
  }),
]);

const currentEntitySchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

const parentCrumbSchema = z.object({
  targetType: z.enum(["UNIVERSITY", "FACULTY", "STUDY_PROGRAM"]),
  id: positiveIntegerSchema,
  name: z.string(),
});

const parentContextSchema = z.array(parentCrumbSchema).nullable().optional();

const adminPendingChangeSchema = pendingChangeSchema.and(
  z.object({
    user: pendingChangeUserSchema,
    currentEntity: currentEntitySchema,
    parentContext: parentContextSchema,
  }),
);

const pendingChangeWithEntitySchema = pendingChangeSchema.and(
  z.object({
    currentEntity: currentEntitySchema,
    parentContext: parentContextSchema,
  }),
);

const pendingChangesResponseSchema = z.object({
  message: z.string(),
  data: z.array(pendingChangeWithEntitySchema),
});

const adminPendingChangesResponseSchema = z.object({
  message: z.string(),
  data: z.array(adminPendingChangeSchema),
});

const pendingChangeResponseSchema = z.object({
  message: z.string(),
  data: pendingChangeSchema,
});

export type PendingChange = z.infer<typeof pendingChangeWithEntitySchema>;
export type AdminPendingChange = z.infer<typeof adminPendingChangeSchema>;
export type ParentCrumb = z.infer<typeof parentCrumbSchema>;
export {
  adminPendingChangesResponseSchema,
  pendingChangeResponseSchema,
  pendingChangesResponseSchema,
};

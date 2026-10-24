import { z } from "zod";

import {
  targetTypeSchema,
  positiveIntegerSchema,
  userRoleSchema,
} from "./domain";

import {
  facultyCreateDataSchema,
  facultyEditDataSchema,
  studyProgramCreateDataSchema,
  studyProgramEditDataSchema,
  trackCreateDataSchema,
  trackEditDataSchema,
  universityCreateDataSchema,
  universityEditDataSchema,
} from "./contribution";

const pendingChangeUserSchema = z
  .object({
    email: z.email(),
    role: userRoleSchema,
  })
  .loose();

const pendingChangeBaseSchema = z.object({
  id: z.string().min(1),
  userId: z.string(),
  user: pendingChangeUserSchema.nullable().optional(),
  createdAt: z.coerce.date(),
});

const pendingChangeSchema = z.union([
  pendingChangeBaseSchema.extend({
    targetType: z.literal("UNIVERSITY"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: z.null(),
    data: universityCreateDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: positiveIntegerSchema,
    data: facultyCreateDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: positiveIntegerSchema,
    data: studyProgramCreateDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("TRACK"),
    typeOfChange: z.literal("CREATE"),
    targetId: z.null(),
    parentId: positiveIntegerSchema,
    data: trackCreateDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("UNIVERSITY"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: universityEditDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: facultyEditDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: studyProgramEditDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: z.literal("TRACK"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: trackEditDataSchema,
  }),
  pendingChangeBaseSchema.extend({
    targetType: targetTypeSchema,
    typeOfChange: z.literal("DELETE"),
    targetId: positiveIntegerSchema,
    parentId: z.null(),
    data: z.strictObject({}),
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
  pendingChangeSchema,
  pendingChangeResponseSchema,
  pendingChangesResponseSchema,
};

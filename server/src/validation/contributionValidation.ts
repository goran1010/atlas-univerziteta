import { z } from "zod";

import { parseRequest } from "./parseRequest.js";

const targetTypeSchema = z.enum(
  ["UNIVERSITY", "FACULTY", "STUDY_PROGRAM", "TRACK"],
  {
    error: "Invalid entity type",
  },
);

const parentIdSchema = z
  .number({
    error: "Parent ID must be a positive integer",
  })
  .int({
    error: "Parent ID must be a positive integer",
  })
  .positive({
    error: "Parent ID must be a positive integer",
  });

const targetIdSchema = z
  .number({
    error: "Target ID must be a positive integer",
  })
  .int({
    error: "Target ID must be a positive integer",
  })
  .positive({
    error: "Target ID must be a positive integer",
  });

const durationYearsSchema = z
  .number({
    error: "Duration must be between 1 and 10 years",
  })
  .int({
    error: "Duration must be between 1 and 10 years",
  })
  .min(1, {
    error: "Duration must be between 1 and 10 years",
  })
  .max(10, {
    error: "Duration must be between 1 and 10 years",
  });

const ectsSchema = z
  .number({
    error: "ECTS must be a positive integer",
  })
  .int({
    error: "ECTS must be a positive integer",
  })
  .positive({
    error: "ECTS must be a positive integer",
  });

// http(s) only - bare z.url() accepts javascript: and data: URLs
const websiteSchema = z
  .url({ protocol: /^https?$/, error: "Invalid URL" })
  .max(254);

const commentSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000, { error: "Comment must be 1000 characters or fewer" })
  .optional();

const universityCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "Name is required" }).max(200),

  city: z.string().trim().min(1, { error: "City is required" }).max(200),

  entity: z.enum(["FBIH", "RS", "BD"], {
    error: "Invalid entity - must be FBIH, RS, or BD",
  }),

  ownership: z.enum(["PUBLIC", "PRIVATE"], {
    error: "Ownership must be PUBLIC or PRIVATE",
  }),

  acronym: z.string().trim().min(1).max(20).optional(),

  foundedYear: z.string().trim().min(1).max(20).optional(),

  website: websiteSchema.optional(),

  address: z.string().trim().min(1).max(300).optional(),

  phone: z.string().trim().min(1).max(50).optional(),

  email: z.email({ error: "Invalid email" }).max(254).optional(),
});

const facultyCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "Name is required" }).max(200),

  city: z.string().trim().min(1).max(200).optional(),

  website: websiteSchema.optional(),

  address: z.string().trim().min(1).max(300).optional(),

  phone: z.string().trim().min(1).max(50).optional(),

  email: z.email({ error: "Invalid email" }).max(254).optional(),
});

const studyProgramCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "Name is required" }).max(200),

  cycle: z.enum(
    ["FIRST", "SECOND", "THIRD", "INTEGRATED", "VOCATIONAL", "SPECIALIST"],
    {
      error:
        "Invalid study cycle - must be FIRST, SECOND, THIRD, INTEGRATED, VOCATIONAL, or SPECIALIST",
    },
  ),

  durationYears: durationYearsSchema.optional(),

  ects: ectsSchema.optional(),

  language: z.string().trim().min(1).max(100).optional(),
});

const trackCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, { error: "Name is required" }).max(200),

  ects: ectsSchema.optional(),

  durationYears: durationYearsSchema.optional(),
});

const createEntitySchema = z.discriminatedUnion("targetType", [
  z.strictObject({
    targetType: z.literal("UNIVERSITY"),
    data: universityCreateDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("FACULTY"),
    parentId: parentIdSchema,
    data: facultyCreateDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("STUDY_PROGRAM"),
    parentId: parentIdSchema,
    data: studyProgramCreateDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("TRACK"),
    parentId: parentIdSchema,
    data: trackCreateDataSchema,
    comment: commentSchema,
  }),
]);

const universityEditDataSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, {
        error: "Name cannot be empty if provided",
      })
      .max(200)
      .optional(),

    city: z
      .string()
      .trim()
      .min(1, { error: "City cannot be empty if provided" })
      .max(200)
      .optional(),

    entity: z
      .enum(["FBIH", "RS", "BD"], {
        error: "Invalid entity - must be FBIH, RS, or BD",
      })
      .optional(),

    ownership: z
      .enum(["PUBLIC", "PRIVATE"], {
        error: "Ownership must be PUBLIC or PRIVATE",
      })
      .optional(),

    acronym: z.string().trim().min(1).max(20).nullable().optional(),

    foundedYear: z.string().trim().min(1).max(20).nullable().optional(),

    website: websiteSchema.nullable().optional(),

    address: z.string().trim().min(1).max(300).nullable().optional(),

    phone: z.string().trim().min(1).max(50).nullable().optional(),

    email: z.email({ error: "Invalid email" }).max(254).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

const facultyEditDataSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, {
        error: "Name cannot be empty if provided",
      })
      .max(200)
      .optional(),

    city: z
      .string()
      .trim()
      .min(1, { error: "City cannot be empty if provided" })
      .max(200)
      .nullable()
      .optional(),

    website: websiteSchema.nullable().optional(),

    address: z.string().trim().min(1).max(300).nullable().optional(),

    phone: z.string().trim().min(1).max(50).nullable().optional(),

    email: z.email({ error: "Invalid email" }).max(254).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

const studyProgramEditDataSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, {
        error: "Name cannot be empty if provided",
      })
      .max(200)
      .optional(),

    cycle: z
      .enum(
        ["FIRST", "SECOND", "THIRD", "INTEGRATED", "VOCATIONAL", "SPECIALIST"],
        {
          error: "Invalid study cycle",
        },
      )
      .optional(),

    durationYears: durationYearsSchema.nullable().optional(),

    ects: ectsSchema.nullable().optional(),

    language: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

const trackEditDataSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, {
        error: "Name cannot be empty if provided",
      })
      .max(200)
      .optional(),

    ects: ectsSchema.nullable().optional(),

    durationYears: durationYearsSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

const editEntitySchema = z.discriminatedUnion("targetType", [
  z.strictObject({
    targetType: z.literal("UNIVERSITY"),
    targetId: targetIdSchema,
    data: universityEditDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("FACULTY"),
    targetId: targetIdSchema,
    data: facultyEditDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("STUDY_PROGRAM"),
    targetId: targetIdSchema,
    data: studyProgramEditDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("TRACK"),
    targetId: targetIdSchema,
    data: trackEditDataSchema,
    comment: commentSchema,
  }),
]);

const deleteEntitySchema = z.strictObject({
  targetType: targetTypeSchema,

  targetId: targetIdSchema,

  comment: commentSchema,
});

const deletePendingChangeSchema = z.strictObject({
  id: z
    .string()
    .trim()
    .min(1, {
      error: "Pending change ID is required",
    })
    .pipe(
      z.uuid({
        error: "Pending change ID must be a valid UUID",
      }),
    ),
});

function createEntity(input: unknown) {
  return parseRequest(createEntitySchema, input);
}

function editEntity(input: unknown) {
  return parseRequest(editEntitySchema, input);
}

function deleteEntity(input: unknown) {
  return parseRequest(deleteEntitySchema, input);
}

function deletePendingChange(input: unknown) {
  return parseRequest(deletePendingChangeSchema, input);
}

export {
  createEntity,
  editEntity,
  deleteEntity,
  deletePendingChange,
  universityCreateDataSchema,
  facultyCreateDataSchema,
  studyProgramCreateDataSchema,
  trackCreateDataSchema,
  universityEditDataSchema,
  facultyEditDataSchema,
  studyProgramEditDataSchema,
  trackEditDataSchema,
};

export type UniversityCreateData = z.infer<typeof universityCreateDataSchema>;
export type FacultyCreateData = z.infer<typeof facultyCreateDataSchema>;
export type StudyProgramCreateData = z.infer<
  typeof studyProgramCreateDataSchema
>;
export type TrackCreateData = z.infer<typeof trackCreateDataSchema>;
export type UniversityEditData = z.infer<typeof universityEditDataSchema>;
export type FacultyEditData = z.infer<typeof facultyEditDataSchema>;
export type StudyProgramEditData = z.infer<typeof studyProgramEditDataSchema>;
export type TrackEditData = z.infer<typeof trackEditDataSchema>;

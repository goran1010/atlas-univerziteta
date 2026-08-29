import { z } from "zod";

import { RequestValidationError } from "../errors/RequestValidationError.js";

const entityTypeSchema = z.enum(
  ["UNIVERSITY", "FACULTY", "STUDY_PROGRAM", "SUBJECT", "TRACK"],
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

const semesterSchema = z
  .number({
    error: "Semester must be between 1 and 12",
  })
  .int({
    error: "Semester must be between 1 and 12",
  })
  .min(1, {
    error: "Semester must be between 1 and 12",
  })
  .max(12, {
    error: "Semester must be between 1 and 12",
  });

const universityCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, {
    error: "Name is required",
  }),

  city: z.string().trim().min(1, {
    error: "City is required",
  }),

  entity: z.enum(["FBIH", "RS", "BD"], {
    error: "Invalid entity - must be FBIH, RS, or BD",
  }),

  ownership: z.enum(["PUBLIC", "PRIVATE"], {
    error: "Ownership must be PUBLIC or PRIVATE",
  }),

  acronym: z.string().trim().min(1).optional(),

  foundedYear: z.string().trim().min(1).optional(),

  website: z.url({ error: "Invalid URL" }).optional(),

  address: z.string().trim().min(1).optional(),

  phone: z.string().trim().min(1).optional(),

  email: z.email({ error: "Invalid email" }).optional(),
});

const facultyCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, {
    error: "Name is required",
  }),

  city: z.string().trim().optional(),

  website: z.url({ error: "Invalid URL" }).optional(),

  address: z.string().trim().min(1).optional(),

  phone: z.string().trim().min(1).optional(),

  email: z.email({ error: "Invalid email" }).optional(),
});

const studyProgramCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, {
    error: "Name is required",
  }),

  cycle: z.enum(
    ["FIRST", "SECOND", "THIRD", "INTEGRATED", "VOCATIONAL", "SPECIALIST"],
    {
      error:
        "Invalid study cycle - must be FIRST, SECOND, THIRD, INTEGRATED, VOCATIONAL, or SPECIALIST",
    },
  ),

  durationYears: durationYearsSchema.optional(),

  ects: ectsSchema.optional(),

  language: z.string().trim().min(1).optional(),
});

const subjectCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, {
    error: "Name is required",
  }),

  semester: semesterSchema.optional(),

  ects: ectsSchema.optional(),

  type: z
    .enum(["MANDATORY", "ELECTIVE"], {
      error: "Invalid subject type - must be MANDATORY or ELECTIVE",
    })
    .optional(),
});

const trackCreateDataSchema = z.strictObject({
  name: z.string().trim().min(1, {
    error: "Name is required",
  }),

  ects: ectsSchema.optional(),

  durationYears: durationYearsSchema.optional(),
});

const createEntitySchema = z.discriminatedUnion("entityType", [
  z.strictObject({
    entityType: z.literal("UNIVERSITY"),
    data: universityCreateDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("FACULTY"),
    parentId: parentIdSchema,
    data: facultyCreateDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("STUDY_PROGRAM"),
    parentId: parentIdSchema,
    data: studyProgramCreateDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("SUBJECT"),
    parentId: parentIdSchema,
    data: subjectCreateDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("TRACK"),
    parentId: parentIdSchema,
    data: trackCreateDataSchema,
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
      .optional(),

    city: z
      .string()
      .trim()
      .min(1, { error: "City cannot be empty if provided" })
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

    acronym: z.string().trim().min(1).nullable().optional(),

    foundedYear: z.string().trim().min(1).nullable().optional(),

    website: z.url({ error: "Invalid URL" }).nullable().optional(),

    address: z.string().trim().min(1).nullable().optional(),

    phone: z.string().trim().min(1).nullable().optional(),

    email: z.email({ error: "Invalid email" }).nullable().optional(),
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
      .optional(),

    city: z
      .string()
      .trim()
      .min(1, { error: "City cannot be empty if provided" })
      .nullable()
      .optional(),

    website: z.url({ error: "Invalid URL" }).nullable().optional(),

    address: z.string().trim().min(1).nullable().optional(),

    phone: z.string().trim().min(1).nullable().optional(),

    email: z.email({ error: "Invalid email" }).nullable().optional(),
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

    language: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

const subjectEditDataSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, {
        error: "Name cannot be empty if provided",
      })
      .optional(),

    semester: semesterSchema.nullable().optional(),

    ects: ectsSchema.nullable().optional(),

    type: z
      .enum(["MANDATORY", "ELECTIVE"], {
        error: "Invalid subject type - must be MANDATORY or ELECTIVE",
      })
      .nullable()
      .optional(),
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
      .optional(),

    ects: ectsSchema.nullable().optional(),

    durationYears: durationYearsSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  });

const editEntitySchema = z.discriminatedUnion("entityType", [
  z.strictObject({
    entityType: z.literal("UNIVERSITY"),
    targetId: targetIdSchema,
    data: universityEditDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("FACULTY"),
    targetId: targetIdSchema,
    data: facultyEditDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("STUDY_PROGRAM"),
    targetId: targetIdSchema,
    data: studyProgramEditDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("SUBJECT"),
    targetId: targetIdSchema,
    data: subjectEditDataSchema,
  }),

  z.strictObject({
    entityType: z.literal("TRACK"),
    targetId: targetIdSchema,
    data: trackEditDataSchema,
  }),
]);

const deleteEntitySchema = z.strictObject({
  entityType: entityTypeSchema,

  targetId: targetIdSchema,
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
  const result = createEntitySchema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error);
  }

  return result.data;
}

function editEntity(input: unknown) {
  const result = editEntitySchema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error);
  }

  return result.data;
}

function deleteEntity(input: unknown) {
  const result = deleteEntitySchema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error);
  }

  return result.data;
}

function deletePendingChange(input: unknown) {
  const result = deletePendingChangeSchema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error);
  }

  return result.data;
}

export {
  createEntity,
  editEntity,
  deleteEntity,
  deletePendingChange,
  universityCreateDataSchema,
  facultyCreateDataSchema,
  studyProgramCreateDataSchema,
  subjectCreateDataSchema,
  trackCreateDataSchema,
  universityEditDataSchema,
  facultyEditDataSchema,
  studyProgramEditDataSchema,
  subjectEditDataSchema,
  trackEditDataSchema,
};

export type UniversityCreateData = z.infer<typeof universityCreateDataSchema>;
export type FacultyCreateData = z.infer<typeof facultyCreateDataSchema>;
export type StudyProgramCreateData = z.infer<
  typeof studyProgramCreateDataSchema
>;
export type SubjectCreateData = z.infer<typeof subjectCreateDataSchema>;
export type TrackCreateData = z.infer<typeof trackCreateDataSchema>;
export type UniversityEditData = z.infer<typeof universityEditDataSchema>;
export type FacultyEditData = z.infer<typeof facultyEditDataSchema>;
export type StudyProgramEditData = z.infer<typeof studyProgramEditDataSchema>;
export type SubjectEditData = z.infer<typeof subjectEditDataSchema>;
export type TrackEditData = z.infer<typeof trackEditDataSchema>;

import { z } from "zod";

import { parseRequest } from "./parseRequest.js";
import {
  COUNTRIES,
  ENTITIES,
  ENTITY_RULE_MESSAGE,
  entityFitsCountry,
} from "./countries.js";
import { PROGRAM_LANGUAGES } from "./languages.js";

const targetTypeSchema = z.enum(
  ["UNIVERSITY", "FACULTY", "STUDY_PROGRAM", "TRACK"],
  {
    error: "Invalid target type",
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

// Field rules shared with the seed, so data is checked the same way before
// every write
const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Name is required" })
  .max(200);
const citySchema = z.string().trim().min(1).max(200);
const acronymSchema = z.string().trim().min(1).max(20);
const foundedYearSchema = z.string().trim().min(1).max(20);
const addressSchema = z.string().trim().min(1).max(300);
const phoneSchema = z.string().trim().min(1).max(50);
const emailSchema = z.email({ error: "Invalid email" }).max(254);
const languagesSchema = z
  .array(
    z.enum(PROGRAM_LANGUAGES, {
      error: `Invalid language - must be one of ${PROGRAM_LANGUAGES.join(", ")}`,
    }),
  )
  .refine((codes) => new Set(codes).size === codes.length, {
    error: "Each language can be listed only once",
  });

const commentSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000, { error: "Comment must be 1000 characters or fewer" })
  .optional();

const universityCreateDataSchema = z
  .strictObject({
    name: nameSchema,

    city: z.string().trim().min(1, { error: "City is required" }).max(200),

    country: z.enum(COUNTRIES, {
      error: `Invalid country - must be one of ${COUNTRIES.join(", ")}`,
    }),

    entity: z
      .enum(ENTITIES, {
        error: `Invalid entity - must be one of ${ENTITIES.join(", ")}`,
      })
      .optional(),

    ownership: z.enum(["PUBLIC", "PRIVATE"], {
      error: "Ownership must be PUBLIC or PRIVATE",
    }),

    acronym: acronymSchema.optional(),

    foundedYear: foundedYearSchema.optional(),

    website: websiteSchema.optional(),

    address: addressSchema.optional(),

    phone: phoneSchema.optional(),

    email: emailSchema.optional(),
  })
  .refine((u) => entityFitsCountry(u.country, u.entity), {
    message: ENTITY_RULE_MESSAGE,
    path: ["entity"],
  });

const facultyCreateDataSchema = z.strictObject({
  name: nameSchema,

  city: citySchema.optional(),

  website: websiteSchema.optional(),

  address: addressSchema.optional(),

  phone: phoneSchema.optional(),

  email: emailSchema.optional(),
});

const studyProgramCreateDataSchema = z.strictObject({
  name: nameSchema,

  cycle: z.enum(
    ["FIRST", "SECOND", "THIRD", "INTEGRATED", "VOCATIONAL", "SPECIALIST"],
    {
      error:
        "Invalid study cycle - must be FIRST, SECOND, THIRD, INTEGRATED, VOCATIONAL, or SPECIALIST",
    },
  ),

  durationYears: durationYearsSchema.optional(),

  ects: ectsSchema.optional(),

  languages: languagesSchema.optional(),
});

const trackCreateDataSchema = z.strictObject({
  name: nameSchema,

  ects: ectsSchema.optional(),

  durationYears: durationYearsSchema.optional(),
});

// A CREATE may carry a whole subtree in the seed JSON structure (faculties >
// studyPrograms > tracks); a flat create is simply a tree without children.
// Approval applies the tree in one transaction, so sibling duplicates - which
// would trip the DB unique constraints mid-apply - are rejected up front.
const MAX_TREE_NODES = 800;

const treeTooLargeError = `A tree submission can contain at most ${String(MAX_TREE_NODES)} items`;

function duplicateIndexes<Item>(
  items: Item[] | undefined,
  keyOf: (item: Item) => string,
): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  (items ?? []).forEach((item, index) => {
    const key = keyOf(item);
    if (seen.has(key)) duplicates.push(index);
    seen.add(key);
  });
  return duplicates;
}

function countStudyProgramNodes(program: { tracks?: unknown[] | undefined }) {
  return 1 + (program.tracks?.length ?? 0);
}

function countFacultyNodes(faculty: {
  studyPrograms?: { tracks?: unknown[] | undefined }[] | undefined;
}) {
  let count = 1;
  for (const program of faculty.studyPrograms ?? []) {
    count += countStudyProgramNodes(program);
  }
  return count;
}

function countUniversityNodes(university: {
  faculties?:
    | { studyPrograms?: { tracks?: unknown[] | undefined }[] | undefined }[]
    | undefined;
}) {
  let count = 1;
  for (const faculty of university.faculties ?? []) {
    count += countFacultyNodes(faculty);
  }
  return count;
}

const studyProgramTreeDataSchema = studyProgramCreateDataSchema
  .extend({
    tracks: z.array(trackCreateDataSchema).min(1).optional(),
  })
  .superRefine((program, ctx) => {
    for (const index of duplicateIndexes(
      program.tracks,
      (track) => track.name,
    )) {
      ctx.addIssue({
        code: "custom",
        path: ["tracks", index, "name"],
        message: "Duplicate track name in this study program",
      });
    }

    if (countStudyProgramNodes(program) > MAX_TREE_NODES) {
      ctx.addIssue({ code: "custom", message: treeTooLargeError });
    }
  });

const facultyTreeDataSchema = facultyCreateDataSchema
  .extend({
    studyPrograms: z.array(studyProgramTreeDataSchema).min(1).optional(),
  })
  .superRefine((faculty, ctx) => {
    for (const index of duplicateIndexes(
      faculty.studyPrograms,
      (program) => `${program.cycle}:${program.name}`,
    )) {
      ctx.addIssue({
        code: "custom",
        path: ["studyPrograms", index, "name"],
        message:
          "Duplicate study program (same name and cycle) in this faculty",
      });
    }

    if (countFacultyNodes(faculty) > MAX_TREE_NODES) {
      ctx.addIssue({ code: "custom", message: treeTooLargeError });
    }
  });

const universityTreeDataSchema = universityCreateDataSchema
  .extend({
    faculties: z.array(facultyTreeDataSchema).min(1).optional(),
  })
  .superRefine((university, ctx) => {
    for (const index of duplicateIndexes(
      university.faculties,
      (faculty) => faculty.name,
    )) {
      ctx.addIssue({
        code: "custom",
        path: ["faculties", index, "name"],
        message: "Duplicate faculty name in this university",
      });
    }

    if (countUniversityNodes(university) > MAX_TREE_NODES) {
      ctx.addIssue({ code: "custom", message: treeTooLargeError });
    }
  });

const createEntitySchema = z.discriminatedUnion("targetType", [
  z.strictObject({
    targetType: z.literal("UNIVERSITY"),
    data: universityTreeDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("FACULTY"),
    parentId: parentIdSchema,
    data: facultyTreeDataSchema,
    comment: commentSchema,
  }),

  z.strictObject({
    targetType: z.literal("STUDY_PROGRAM"),
    parentId: parentIdSchema,
    data: studyProgramTreeDataSchema,
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

    country: z
      .enum(COUNTRIES, {
        error: `Invalid country - must be one of ${COUNTRIES.join(", ")}`,
      })
      .optional(),

    entity: z
      .enum(ENTITIES, {
        error: `Invalid entity - must be one of ${ENTITIES.join(", ")}`,
      })
      .nullable()
      .optional(),

    ownership: z
      .enum(["PUBLIC", "PRIVATE"], {
        error: "Ownership must be PUBLIC or PRIVATE",
      })
      .optional(),

    acronym: acronymSchema.nullable().optional(),

    foundedYear: foundedYearSchema.nullable().optional(),

    website: websiteSchema.nullable().optional(),

    address: addressSchema.nullable().optional(),

    phone: phoneSchema.nullable().optional(),

    email: emailSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided",
  })
  // an edit that leaves country or entity out is checked against the merged
  // row when it is approved
  .refine(
    (data) =>
      data.country === undefined ||
      data.entity === undefined ||
      entityFitsCountry(data.country, data.entity),
    { message: ENTITY_RULE_MESSAGE, path: ["entity"] },
  );

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

    address: addressSchema.nullable().optional(),

    phone: phoneSchema.nullable().optional(),

    email: emailSchema.nullable().optional(),
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

    // an empty list clears the languages
    languages: languagesSchema.optional(),
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
  acronymSchema,
  addressSchema,
  citySchema,
  durationYearsSchema,
  ectsSchema,
  emailSchema,
  foundedYearSchema,
  languagesSchema,
  nameSchema,
  phoneSchema,
  websiteSchema,
  trackCreateDataSchema,
  universityTreeDataSchema,
  facultyTreeDataSchema,
  studyProgramTreeDataSchema,
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
export type UniversityTreeData = z.infer<typeof universityTreeDataSchema>;
export type FacultyTreeData = z.infer<typeof facultyTreeDataSchema>;
export type StudyProgramTreeData = z.infer<typeof studyProgramTreeDataSchema>;
export type UniversityEditData = z.infer<typeof universityEditDataSchema>;
export type FacultyEditData = z.infer<typeof facultyEditDataSchema>;
export type StudyProgramEditData = z.infer<typeof studyProgramEditDataSchema>;
export type TrackEditData = z.infer<typeof trackEditDataSchema>;

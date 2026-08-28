import type { PendingChange } from "../../schemas/pendingChange";

export type EntityType =
  | "UNIVERSITY"
  | "FACULTY"
  | "STUDY_PROGRAM"
  | "SUBJECT"
  | "TRACK";
export type TypeOfChange = "CREATE" | "UPDATE" | "DELETE";
export type Cycle =
  | "PRVI"
  | "DRUGI"
  | "TRECI"
  | "INTEGRISANI"
  | "STRUCNI"
  | "SPECIJALISTICKI";
export type SubjectType = "OBAVEZNI" | "IZBORNI";
export type Entity = "FBIH" | "RS" | "BD";

export interface ContributionFormDraft {
  name?: string;
  city?: string;
  entity?: Entity;
  ownership?: "JAVNA" | "PRIVATNA";
  acronym?: string;
  foundedYear?: string;
  website?: string;
  cycle?: Cycle;
  durationYears?: number;
  ects?: number;
  language?: string;
  semester?: number;
  type?: SubjectType;
}

export interface ContributionFormState {
  entityType: EntityType;
  typeOfChange: TypeOfChange;
  parentId: string;
  targetId: string;
  data: ContributionFormDraft;
}

export type { PendingChange };

import type { PendingChange } from "../../schemas/pendingChange";

export type EntityType =
  | "UNIVERSITY"
  | "FACULTY"
  | "STUDY_PROGRAM"
  | "SUBJECT"
  | "TRACK";
export type TypeOfChange = "CREATE" | "UPDATE" | "DELETE";
export type Cycle =
  | "FIRST"
  | "SECOND"
  | "THIRD"
  | "INTEGRATED"
  | "VOCATIONAL"
  | "SPECIALIST";
export type SubjectType = "MANDATORY" | "ELECTIVE";
export type Entity = "FBIH" | "RS" | "BD";

export interface ContributionFormDraft {
  name?: string;
  city?: string;
  entity?: Entity;
  ownership?: "PUBLIC" | "PRIVATE";
  acronym?: string;
  foundedYear?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
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

export interface ContributionOutletContext {
  pendingChanges: PendingChange[];
  setPendingChanges: import("react").Dispatch<
    import("react").SetStateAction<PendingChange[]>
  >;
  loading: boolean;
}

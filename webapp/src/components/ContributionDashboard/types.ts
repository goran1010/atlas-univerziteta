import type { Dispatch, SetStateAction } from "react";
import type {
  Country,
  Entity,
  TargetType,
  Ownership,
  ProgramLanguage,
  StudyCycle,
  TypeOfChange,
} from "../../schemas/domain";
import type { PendingChange } from "../../schemas/pendingChange";

export interface ContributionFormDraft {
  name?: string | undefined;
  city?: string | undefined;
  country?: Country | undefined;
  entity?: Entity | undefined;
  ownership?: Ownership | undefined;
  acronym?: string | undefined;
  foundedYear?: string | undefined;
  website?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  cycle?: StudyCycle | undefined;
  durationYears?: number | undefined;
  ects?: number | undefined;
  languages?: ProgramLanguage[] | undefined;
}

export type DraftFieldValue = string | number | ProgramLanguage[] | undefined;

export interface ContributionFormState {
  targetType: TargetType;
  typeOfChange: TypeOfChange;
  parentId: string;
  targetId: string;
  data: ContributionFormDraft;
  comment: string;
}

export interface ContributionOutletContext {
  pendingChanges: PendingChange[];
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>;
  loading: boolean;
  refetchPendingChanges: () => void;
}

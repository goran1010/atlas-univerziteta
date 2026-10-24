import type { Dispatch, SetStateAction } from "react";
import type {
  Entity,
  TargetType,
  Ownership,
  StudyCycle,
  TypeOfChange,
} from "../../schemas/domain";
import type { PendingChange } from "../../schemas/pendingChange";

export interface ContributionFormDraft {
  name?: string;
  city?: string;
  entity?: Entity;
  ownership?: Ownership;
  acronym?: string;
  foundedYear?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  cycle?: StudyCycle;
  durationYears?: number;
  ects?: number;
  language?: string;
}

export interface ContributionFormState {
  targetType: TargetType;
  typeOfChange: TypeOfChange;
  parentId: string;
  targetId: string;
  data: ContributionFormDraft;
}

export interface ContributionOutletContext {
  pendingChanges: PendingChange[];
  setPendingChanges: Dispatch<SetStateAction<PendingChange[]>>;
  loading: boolean;
  refetchPendingChanges: () => void;
}

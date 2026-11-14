import type { SystemLanguage } from "../utils/setInitialLanguage";
import type en from "../locales/en.json";

export type UserData = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null | undefined;
  role?: "ADMIN" | "USER";
  adminRequestedAt?: string | null;
  adminRequestReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null;

export type Language = SystemLanguage | "system";
export type SetLanguage = (language: Language) => void;
type KeyPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${KeyPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = KeyPaths<typeof en>;
export type TFunction = (key: TranslationKey) => string;

export type TypeNotification = "success" | "error" | "info" | "warning";

export interface Notification {
  id?: string;
  type: TypeNotification;
  message: string;
  duration?: number | null;
  persistent?: boolean;
}

export type AddNotification = (notification: Notification) => void;
export type RemoveNotification = (id: string | undefined) => void;

// the trio request helpers need to report progress and failures
export interface RequestContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
}

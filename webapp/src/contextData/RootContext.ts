import { createContext } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { UserData } from "../types";
import type { Language, SetLanguage, TFunction } from "../types";
import type {
  AddNotification,
  Notification,
  RemoveNotification,
} from "../types";

interface RootContextType {
  language: Language;
  setLanguage: SetLanguage;
  t: TFunction;
  notifications: Notification[];
  addNotification: AddNotification;
  removeNotification: RemoveNotification;
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
}

const RootContext = createContext<RootContextType>({
  language: "en",
  setLanguage: (prop) => prop,
  t: (prop) => prop,
  notifications: [],
  addNotification: (prop) => prop,
  removeNotification: (prop) => prop,
  userData: null,
  setUserData: (prop) => prop,
});

export { RootContext };
export type { RootContextType };

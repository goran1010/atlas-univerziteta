import { createElement, type ReactNode, useState } from "react";
import { RootContext } from "../../src/contextData/RootContext";
import type { RootContextType } from "../../src/contextData/RootContext";
import { useLanguage } from "../../src/customHooks/useLanguage";
import { useNotification } from "../../src/customHooks/useNotification";
import type { UserData } from "../../src/types/auth";

interface RootContextProviderProps {
  children: ReactNode;
  initialUserData?: UserData;
  rootValue?: Partial<RootContextType>;
}

function RootContextProvider({
  children,
  initialUserData = null,
  rootValue = {},
}: RootContextProviderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userData, setUserData] = useState(initialUserData);
  const { notifications, addNotification, removeNotification } =
    useNotification();

  const value: RootContextType = {
    language,
    setLanguage,
    t,
    notifications,
    addNotification,
    removeNotification,
    userData,
    setUserData,
    ...rootValue,
  };

  return createElement(RootContext, { value }, children);
}

export { RootContextProvider };

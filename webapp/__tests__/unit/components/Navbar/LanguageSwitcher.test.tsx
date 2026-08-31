import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "../../../../src/components/Navbar/LanguageSwitcher";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { AddNotification } from "../../../../src/types/notification";
import type { SetLanguage } from "../../../../src/types/i18n";
import type { Language } from "../../../../src/types/i18n";

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorage.setItem("language", "en");
});

interface WrapperProps {
  addNotification: AddNotification;
  setLanguage: SetLanguage;
  language: Language;
}

function Wrapper({ addNotification, setLanguage, language }: WrapperProps) {
  return (
    <RootContextProvider
      rootValue={{
        addNotification,
        removeNotification: vi.fn(),
        setLanguage,
      }}
    >
      <LanguageSwitcher setLanguage={setLanguage} language={language} />
    </RootContextProvider>
  );
}

describe("LanguageSwitcher", () => {
  test.each<{
    currentLanguage: Language;
    expectedNextLanguage: string;
    expectedMessage: string;
  }>([
    {
      currentLanguage: "system",
      expectedNextLanguage: "en",
      expectedMessage: "Switched to English",
    },
    {
      currentLanguage: "en",
      expectedNextLanguage: "sr",
      expectedMessage: "Switched to Bosnian/Croatian/Serbian",
    },
    {
      currentLanguage: "sr",
      expectedNextLanguage: "system",
      expectedMessage: "Switched to system language",
    },
  ])(
    "cycles from $currentLanguage to $expectedNextLanguage on click",
    async ({ currentLanguage, expectedNextLanguage, expectedMessage }) => {
      const addNotification = vi.fn();
      const setLanguage = vi.fn();

      render(
        <Wrapper
          addNotification={addNotification}
          setLanguage={setLanguage}
          language={currentLanguage}
        />,
      );

      const languageButton = screen.getByRole("button", {
        name: /Toggle language/i,
      });

      expect(languageButton).toBeInTheDocument();
      await userEvent.click(languageButton);

      expect(setLanguage).toHaveBeenCalledWith(expectedNextLanguage);
      expect(addNotification).toHaveBeenCalledWith({
        type: "info",
        message: expectedMessage,
      });
    },
  );
});

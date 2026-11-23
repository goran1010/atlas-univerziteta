import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "../../../../src/components/Navbar/LanguageSwitcher";
import { RootContextProvider } from "../../../utils/rootContextProvider";

import type { Language } from "../../../../src/types";

beforeEach(() => {
  localStorage.setItem("language", "en");
});

function renderSwitcher(language: Language) {
  const addNotification = vi.fn();
  const setLanguage = vi.fn();
  render(
    <RootContextProvider
      rootValue={{ addNotification, removeNotification: vi.fn() }}
    >
      <LanguageSwitcher setLanguage={setLanguage} language={language} />
    </RootContextProvider>,
  );
  return { addNotification, setLanguage, select: screen.getByRole("combobox") };
}

describe("LanguageSwitcher", () => {
  test("lists each language by its code after the select's name", () => {
    const { select } = renderSwitcher("en");

    expect(select).toHaveAccessibleName("Language");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Language: System",
      "Language: EN",
      "Language: SR",
      "Language: SQ",
      "Language: MK",
      "Language: SL",
    ]);
  });

  test.each<Language>(["system", "en", "sr", "sq", "mk", "sl"])(
    "shows %s as the current choice",
    (language) => {
      const { select } = renderSwitcher(language);

      expect(select).toHaveValue(language);
    },
  );

  test.each<{ choice: Language; message: string }>([
    { choice: "sr", message: "Switched to Serbian" },
    { choice: "sq", message: "Switched to Albanian" },
    { choice: "mk", message: "Switched to Macedonian" },
    { choice: "sl", message: "Switched to Slovenian" },
    { choice: "system", message: "Switched to system language" },
  ])("sets $choice and announces it", async ({ choice, message }) => {
    const { select, setLanguage, addNotification } = renderSwitcher("en");

    await userEvent.selectOptions(select, choice);

    expect(setLanguage).toHaveBeenCalledWith(choice);
    expect(addNotification).toHaveBeenCalledWith({ type: "info", message });
  });
});

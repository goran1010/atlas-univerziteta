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
  test("lists each language in itself after the select's name", () => {
    const { select } = renderSwitcher("en");

    expect(select).toHaveAccessibleName("Language");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Language: System",
      "Language: English",
      "Language: Bosanski / Hrvatski / Srpski",
    ]);
  });

  test.each<Language>(["system", "en", "sr"])(
    "shows %s as the current choice",
    (language) => {
      const { select } = renderSwitcher(language);

      expect(select).toHaveValue(language);
    },
  );

  test("sets the chosen language without a notification", async () => {
    const { select, setLanguage, addNotification } = renderSwitcher("en");

    await userEvent.selectOptions(select, "sr");

    expect(setLanguage).toHaveBeenCalledWith("sr");
    expect(addNotification).not.toHaveBeenCalled();
  });
});

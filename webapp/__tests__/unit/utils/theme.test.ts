import {
  isTheme,
  readStoredTheme,
  writeStoredTheme,
} from "../../../src/utils/theme";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isTheme", () => {
  test.each(["system", "light", "dark"])("accepts %s", (value) => {
    expect(isTheme(value)).toBe(true);
  });

  test.each(["", "garbage", "DARK", null, undefined, 1])(
    "rejects %s",
    (value) => {
      expect(isTheme(value)).toBe(false);
    },
  );
});

describe("readStoredTheme", () => {
  test("returns the stored theme when it is valid", () => {
    localStorage.setItem("theme", "dark");

    expect(readStoredTheme()).toBe("dark");
  });

  test("falls back to system when nothing is stored", () => {
    expect(readStoredTheme()).toBe("system");
  });

  test("falls back to system when the stored value is invalid", () => {
    localStorage.setItem("theme", "garbage");

    expect(readStoredTheme()).toBe("system");
  });

  test("falls back to system and warns when localStorage throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied");
    });

    expect(readStoredTheme()).toBe("system");
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("writeStoredTheme", () => {
  test("stores light and dark", () => {
    writeStoredTheme("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    writeStoredTheme("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  test("removes the key for system", () => {
    localStorage.setItem("theme", "dark");

    writeStoredTheme("system");

    expect(localStorage.getItem("theme")).toBeNull();
  });

  test("warns instead of throwing when localStorage throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage denied");
    });

    expect(() => {
      writeStoredTheme("dark");
    }).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });
});

import script from "../../public/theme-init.js?raw";
import html from "../../index.html?raw";

function runPrePaintScript() {
  // the script lives in its own file so the strict script-src CSP allows it;
  // index.html must still load it before anything renders
  if (!html.includes('<script src="/theme-init.js"></script>')) {
    throw new Error("index.html does not load the pre-paint theme script");
  }
  eval(script);
}

function mockSystemDark(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
  } as MediaQueryList);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pre-paint theme script", () => {
  test("applies the dark class when dark is stored", () => {
    localStorage.setItem("theme", "dark");
    mockSystemDark(false);

    runPrePaintScript();

    expect(document.documentElement).toHaveClass("dark");
  });

  test("keeps light when light is stored, even if the OS prefers dark", () => {
    localStorage.setItem("theme", "light");
    mockSystemDark(true);

    runPrePaintScript();

    expect(document.documentElement).not.toHaveClass("dark");
  });

  test("follows the OS preference when nothing is stored", () => {
    mockSystemDark(true);

    runPrePaintScript();

    expect(document.documentElement).toHaveClass("dark");
  });

  test("treats an invalid stored value as system", () => {
    localStorage.setItem("theme", "garbage");
    mockSystemDark(true);

    runPrePaintScript();

    expect(document.documentElement).toHaveClass("dark");
  });

  test("warns and falls back to the OS preference when localStorage throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied");
    });
    mockSystemDark(true);

    runPrePaintScript();

    expect(warn).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveClass("dark");
  });
});

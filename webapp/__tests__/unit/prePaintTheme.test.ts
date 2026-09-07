import html from "../../index.html?raw";

/* The module script tag carries attributes, so this only matches the
   inline pre-paint theme script. */
function runPrePaintScript() {
  const match = /<script>([\s\S]*?)<\/script>/.exec(html);
  if (!match) throw new Error("Pre-paint script not found in index.html");
  eval(match[1]);
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

describe("index.html pre-paint theme script", () => {
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

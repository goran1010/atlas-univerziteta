// Pre-paint theme init: runs synchronously from <head> so the first paint
// already has the right theme class. External file (not inline) so the
// strict script-src CSP allows it.
(() => {
  let theme = null;
  try {
    theme = localStorage.getItem("theme");
  } catch (error) {
    console.warn("Could not read theme from localStorage:", error);
  }
  if (theme !== "dark" && theme !== "light") theme = "system";
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();

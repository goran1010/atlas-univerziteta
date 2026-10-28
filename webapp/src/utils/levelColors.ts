// One hue per hierarchy level, applied as accents (left strips, badges,
// pills) everywhere that level appears: university indigo, faculty teal,
// study program violet, track amber. Action colors (create green, update
// yellow, delete red, accent blue) stay separate - see Button.tsx.
type EntityLevel = "UNIVERSITY" | "FACULTY" | "STUDY_PROGRAM" | "TRACK";

const LEVEL_STRIP: Record<EntityLevel, string> = {
  UNIVERSITY: "border-l-4 border-l-indigo-500 dark:border-l-indigo-400",
  FACULTY: "border-l-4 border-l-teal-500 dark:border-l-teal-400",
  STUDY_PROGRAM: "border-l-4 border-l-violet-500 dark:border-l-violet-400",
  TRACK: "border-l-4 border-l-amber-500 dark:border-l-amber-400",
};

const LEVEL_BADGE: Record<EntityLevel, string> = {
  UNIVERSITY:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  FACULTY: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  STUDY_PROGRAM:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  TRACK: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
};

// the thin vertical guide along an expanded list of children
const LEVEL_GUIDE: Record<EntityLevel, string> = {
  UNIVERSITY: "border-l-2 border-indigo-300 dark:border-indigo-700",
  FACULTY: "border-l-2 border-teal-300 dark:border-teal-700",
  STUDY_PROGRAM: "border-l-2 border-violet-300 dark:border-violet-700",
  TRACK: "border-l-2 border-amber-300 dark:border-amber-700",
};

const LEVEL_TEXT: Record<EntityLevel, string> = {
  UNIVERSITY: "text-indigo-700 dark:text-indigo-300",
  FACULTY: "text-teal-700 dark:text-teal-300",
  STUDY_PROGRAM: "text-violet-700 dark:text-violet-300",
  TRACK: "text-amber-700 dark:text-amber-400",
};

export { LEVEL_STRIP, LEVEL_BADGE, LEVEL_GUIDE, LEVEL_TEXT };
export type { EntityLevel };

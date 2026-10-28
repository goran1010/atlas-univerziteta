import type { TypeOfChange } from "../schemas/domain";

// one badge style per change type, used in pending rows and dialog titles
const CHANGE_TYPE_BADGE: Record<TypeOfChange, string> = {
  CREATE:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  UPDATE:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  DELETE: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

export { CHANGE_TYPE_BADGE };

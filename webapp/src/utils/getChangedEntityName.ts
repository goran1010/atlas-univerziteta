import type { PendingChange } from "../schemas/pendingChange";

// The name identifying what a pending change is about: the current name
// from the database for UPDATE/DELETE, or the proposed name for CREATE.
function getChangedEntityName(
  change: Pick<PendingChange, "currentEntity" | "data">,
): string | null {
  const currentName = change.currentEntity?.name;
  if (typeof currentName === "string") return currentName;

  if ("name" in change.data && typeof change.data.name === "string") {
    return change.data.name;
  }

  return null;
}

export { getChangedEntityName };

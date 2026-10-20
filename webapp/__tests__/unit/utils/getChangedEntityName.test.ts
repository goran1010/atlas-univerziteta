import { getChangedEntityName } from "../../../src/utils/getChangedEntityName";

import type { PendingChange } from "../../../src/schemas/pendingChange";

type NameInput = Pick<PendingChange, "currentEntity" | "data">;

describe("getChangedEntityName", () => {
  test("prefers the current entity name over a proposed rename", () => {
    const change = {
      currentEntity: { name: "Current Name" },
      data: { name: "Proposed Name" },
    } as NameInput;

    expect(getChangedEntityName(change)).toBe("Current Name");
  });

  test("falls back to the proposed name for CREATE changes", () => {
    const change = {
      currentEntity: null,
      data: { name: "Proposed Name" },
    } as NameInput;

    expect(getChangedEntityName(change)).toBe("Proposed Name");
  });

  test("returns null when neither side has a name", () => {
    const change = {
      currentEntity: null,
      data: {},
    } as NameInput;

    expect(getChangedEntityName(change)).toBeNull();
  });
});

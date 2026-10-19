import { expect } from "vitest";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

function getResponseArray(value: unknown): Record<string, unknown>[] {
  expect(Array.isArray(value)).toBe(true);

  return value as Record<string, unknown>[];
}

export { getResponseObject, getResponseArray };

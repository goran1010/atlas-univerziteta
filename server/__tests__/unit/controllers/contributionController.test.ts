import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const {
  createPendingChangeMock,
  findPendingChangesMock,
  deletePendingChangeMock,
  findUniversityMock,
  disconnectMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  createPendingChangeMock: vi.fn(),
  findPendingChangesMock: vi.fn(),
  deletePendingChangeMock: vi.fn(),
  findUniversityMock: vi.fn(),
  disconnectMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock("../../../src/db/prisma.js", () => ({
  prisma: {
    $disconnect: disconnectMock,
    pendingChange: {
      create: createPendingChangeMock,
      findMany: findPendingChangesMock,
      delete: deletePendingChangeMock,
    },
    university: {
      findUnique: findUniversityMock,
    },
  },
}));

vi.mock("../../../src/utils/logger.js", () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

import {
  createEntity,
  deleteEntity,
  deletePendingChange,
  editEntity,
  getPendingChanges,
} from "../../../src/controllers/contributionController.js";
import { RequestValidationError } from "../../../src/errors/RequestValidationError.js";

import type { Request, Response } from "express";

function createMockResponse() {
  const statusMock = vi.fn().mockReturnThis();
  const jsonMock = vi.fn();

  const res = {
    status: statusMock,
    json: jsonMock,
  } as unknown as Response;

  return { res, statusMock, jsonMock };
}

describe("contributionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectMock.mockResolvedValue(undefined);
    findUniversityMock.mockResolvedValue({ id: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("createEntity throws a validation error when contribution data is invalid", async () => {
    const req = {
      user: { id: "1" },
    } as Request;
    const { res } = createMockResponse();

    await expect(createEntity(req, res)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
  });

  test("createEntity responds with status 500 when pending change creation fails", async () => {
    const failure = new Error("create failed");
    const req = {
      user: { id: "1" },
      body: {
        entityType: "UNIVERSITY",
        data: {
          name: "TestCity University",
          city: "TestCity",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
      },
    } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    createPendingChangeMock.mockRejectedValue(failure);

    await createEntity(req, res);

    expect(loggerErrorMock).toHaveBeenCalledWith(failure);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "An error occurred while submitting the suggestion.",
      },
    });
  });

  test("editEntity responds with status 401 when user is not authenticated", async () => {
    const req = {} as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    await editEntity(req, res);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("editEntity throws a validation error when contribution data is invalid", async () => {
    const req = {
      user: { id: "1" },
    } as Request;
    const { res } = createMockResponse();

    await expect(editEntity(req, res)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
  });

  test("editEntity responds with status 500 when pending change creation fails", async () => {
    const failure = new Error("update failed");
    const req = {
      user: { id: "1" },
      body: {
        entityType: "UNIVERSITY",
        targetId: 1,
        data: { name: "Updated Name" },
      },
    } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    createPendingChangeMock.mockRejectedValue(failure);

    await editEntity(req, res);

    expect(loggerErrorMock).toHaveBeenCalledWith(failure);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "An error occurred while submitting the edit suggestion.",
      },
    });
  });

  test("deleteEntity responds with status 401 when user is not authenticated", async () => {
    const req = {} as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    await deleteEntity(req, res);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("deleteEntity responds with status 500 when pending change creation fails", async () => {
    const failure = new Error("delete failed");
    const req = {
      user: { id: "1" },
      body: { entityType: "UNIVERSITY", targetId: 1 },
    } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    createPendingChangeMock.mockRejectedValue(failure);

    await deleteEntity(req, res);

    expect(loggerErrorMock).toHaveBeenCalledWith(failure);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "An error occurred while submitting the deletion suggestion.",
      },
    });
  });

  test("getPendingChanges responds with status 401 when user is not authenticated", async () => {
    const req = {} as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    await getPendingChanges(req, res);

    expect(findPendingChangesMock).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("deletePendingChange responds with status 401 when user is not authenticated", async () => {
    const req = {} as Request;
    const { res, statusMock, jsonMock } = createMockResponse();

    await deletePendingChange(req, res);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        message: "Authentication required: log in and try again.",
      },
    });
  });
});

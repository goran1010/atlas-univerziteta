import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VerifyFunction, IStrategyOptions } from "passport-local";
import type { StrategyOptions } from "passport-github2";
import type { DoneCallback } from "passport";

interface MockGitHubProfile {
  id: string | number;
  emails?: { value: string }[];
}

type GitHubVerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: MockGitHubProfile,
  done: DoneCallback,
) => void | Promise<void>;

type SessionDone = (err: unknown, value?: unknown) => void;

type SerializeUserHandler = (
  user: { id: string | number },
  done: SessionDone,
) => void;

type DeserializeUserHandler = (id: string | number, done: SessionDone) => void;

async function flushMicrotasks(iterations = 5): Promise<void> {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve();
  }
}

class MockLocalStrategy {
  name = "local";
  options: IStrategyOptions;
  _verify: VerifyFunction;

  constructor(options: IStrategyOptions, verify: VerifyFunction) {
    this.options = options;
    this._verify = verify;
  }
}

class MockGitHubStrategy {
  name = "github";
  options: StrategyOptions;
  _verify: GitHubVerifyFunction;

  constructor(options: StrategyOptions, verify: GitHubVerifyFunction) {
    this.options = options;
    this._verify = verify;
  }
}

const passportMock = {
  use: vi.fn(),
  serializeUser: vi.fn(),
  deserializeUser: vi.fn(),
};

const usersModelMock = {
  findUnique: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
};

const prismaMock = {
  user: usersModelMock,
  $disconnect: vi.fn(),
};

const bcryptMock = {
  compare: vi.fn(),
};

vi.mock("passport", () => ({
  default: passportMock,
}));

vi.mock("passport-local", () => ({
  Strategy: MockLocalStrategy,
}));

vi.mock("passport-github2", () => ({
  Strategy: MockGitHubStrategy,
}));

vi.mock("bcryptjs", () => ({
  default: bcryptMock,
}));

vi.mock("../../../src/db/prisma.js", async (originalModule) => ({
  ...(await originalModule()),
  prisma: prismaMock,
}));

async function loadStrategies() {
  await import("../../../src/config/passport.js");

  const localStrategy = passportMock.use.mock.calls[0]?.[0] as
    MockLocalStrategy | undefined;
  const githubStrategy = passportMock.use.mock.calls[1]?.[0] as
    MockGitHubStrategy | undefined;

  if (!localStrategy || !githubStrategy) {
    throw new Error(
      "Passport strategies were not registered during test setup.",
    );
  }

  const serializeUserCandidate: unknown =
    passportMock.serializeUser.mock.calls[0]?.[0];
  const deserializeUserCandidate: unknown =
    passportMock.deserializeUser.mock.calls[0]?.[0];

  if (typeof serializeUserCandidate !== "function") {
    throw new Error("Passport serializeUser was not registered.");
  }

  if (typeof deserializeUserCandidate !== "function") {
    throw new Error("Passport deserializeUser was not registered.");
  }

  return {
    localVerify: localStrategy._verify,
    githubVerify: githubStrategy._verify,
    serializeUser: serializeUserCandidate as SerializeUserHandler,
    deserializeUser: deserializeUserCandidate as DeserializeUserHandler,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  usersModelMock.findUnique.mockReset();
  usersModelMock.update.mockReset();
  usersModelMock.create.mockReset();
  prismaMock.$disconnect.mockReset();
  bcryptMock.compare.mockReset();
});

describe("passport config", () => {
  test("LocalStrategy returns auth error when password does not match", async () => {
    const { localVerify } = await loadStrategies();
    const done = vi.fn();

    usersModelMock.findUnique.mockResolvedValue({ id: 1, password: "hashed" });
    bcryptMock.compare.mockResolvedValue(false);

    localVerify("john@example.com", "wrong-password", done);
    await flushMicrotasks();

    expect(usersModelMock.findUnique).toHaveBeenCalledWith({
      where: { email: "john@example.com" },
    });
    expect(bcryptMock.compare).toHaveBeenCalledWith("wrong-password", "hashed");
    expect(done).toHaveBeenCalledWith(null, false, {
      message: "Incorrect email or password",
    });
  });

  test("LocalStrategy passes thrown model error to done", async () => {
    const { localVerify } = await loadStrategies();
    const done = vi.fn();
    const dbError = new Error("db down");

    usersModelMock.findUnique.mockRejectedValue(dbError);

    localVerify("john@example.com", "any", done);
    await flushMicrotasks();

    expect(done).toHaveBeenCalledWith(dbError);
  });

  test("GitHubStrategy returns existing user by githubId", async () => {
    const { githubVerify } = await loadStrategies();
    const done = vi.fn();
    const existingUser = { id: 10, githubId: "123" };

    usersModelMock.findUnique.mockResolvedValueOnce(existingUser);

    await githubVerify("token", "refresh", { id: "123" }, done);

    expect(usersModelMock.findUnique).toHaveBeenCalledWith({
      where: { githubId: "123" },
    });
    expect(done).toHaveBeenCalledWith(null, existingUser);
    expect(usersModelMock.update).not.toHaveBeenCalled();
    expect(usersModelMock.create).not.toHaveBeenCalled();
  });

  test("GitHubStrategy returns auth error when profile has no public email", async () => {
    const { githubVerify } = await loadStrategies();
    const done = vi.fn();

    usersModelMock.findUnique.mockResolvedValueOnce(null);

    await githubVerify("token", "refresh", { id: 123, emails: [] }, done);

    expect(done).toHaveBeenCalledWith(null, false);
    expect(usersModelMock.update).not.toHaveBeenCalled();
    expect(usersModelMock.create).not.toHaveBeenCalled();
  });

  test("GitHubStrategy links githubId to existing email user", async () => {
    const { githubVerify } = await loadStrategies();
    const done = vi.fn();
    const userByEmail = { id: 7, email: "github-user@example.com" };
    const linkedUser = {
      id: 7,
      email: "github-user@example.com",
      githubId: "123",
    };

    usersModelMock.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(userByEmail);
    usersModelMock.update.mockResolvedValue(linkedUser);

    await githubVerify(
      "token",
      "refresh",
      { id: "123", emails: [{ value: "github-user@example.com" }] },
      done,
    );
    await flushMicrotasks();

    expect(usersModelMock.findUnique).toHaveBeenNthCalledWith(1, {
      where: { githubId: "123" },
    });
    expect(usersModelMock.findUnique).toHaveBeenNthCalledWith(2, {
      where: { email: "github-user@example.com" },
    });
    expect(usersModelMock.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { githubId: "123" },
    });
    expect(done).toHaveBeenCalledWith(null, linkedUser);
  });

  test("GitHubStrategy creates user when githubId and email user do not exist", async () => {
    const { githubVerify } = await loadStrategies();
    const done = vi.fn();
    const createdUser = {
      id: 9,
      email: "new-github@example.com",
      githubId: "555",
    };

    usersModelMock.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    usersModelMock.create.mockResolvedValue(createdUser);

    await githubVerify(
      "token",
      "refresh",
      { id: "555", emails: [{ value: "new-github@example.com" }] },
      done,
    );
    await flushMicrotasks();

    expect(usersModelMock.create).toHaveBeenCalledWith({
      data: {
        email: "new-github@example.com",
        githubId: "555",
      },
    });
    expect(done).toHaveBeenCalledWith(null, createdUser);
  });

  test("GitHubStrategy passes thrown error to done", async () => {
    const { githubVerify } = await loadStrategies();
    const done = vi.fn();
    const githubError = new Error("github failure");

    usersModelMock.findUnique.mockRejectedValue(githubError);

    await githubVerify("token", "refresh", { id: 1000 }, done);

    expect(done).toHaveBeenCalledWith(githubError);
  });

  test("serializeUser calls done with user id", async () => {
    const { serializeUser } = await loadStrategies();
    const done = vi.fn();

    serializeUser({ id: 42 }, done);

    expect(done).toHaveBeenCalledWith(null, 42);
  });

  test("serializeUser catches thrown error from done callback", async () => {
    const { serializeUser } = await loadStrategies();
    const done = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("done explode");
      })
      .mockImplementation(() => vi.fn());

    serializeUser({ id: 42 }, done);

    expect(done).toHaveBeenCalledTimes(2);
    const secondCallError: unknown = done.mock.calls[1]?.[0];

    expect(secondCallError).toBeInstanceOf(Error);
    expect((secondCallError as Error).message).toBe("done explode");
  });

  test("deserializeUser returns fetched user", async () => {
    const { deserializeUser } = await loadStrategies();
    const done = vi.fn();
    const user = { id: 2, email: "u@example.com" };

    usersModelMock.findUnique.mockResolvedValue(user);

    deserializeUser(2, done);
    await flushMicrotasks();

    expect(usersModelMock.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
    });
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test("deserializeUser passes thrown model error to done", async () => {
    const { deserializeUser } = await loadStrategies();
    const done = vi.fn();
    const dbError = new Error("db read failed");

    usersModelMock.findUnique.mockRejectedValue(dbError);

    deserializeUser(2, done);
    await flushMicrotasks();

    expect(done).toHaveBeenCalledWith(dbError);
  });
});

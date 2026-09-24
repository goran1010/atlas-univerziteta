interface CreateNewUserInputOptions {
  id?: string;
  email?: string;
  password?: string;
  role?: "USER" | "ADMIN";
  githubId?: string | null;
  googleId?: string | null;
  "confirm-password"?: string;
}

function createNewUserInput(user: CreateNewUserInputOptions = {}) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);

  const newUser = {
    id: user.id ?? `${timestamp.toString()}_${randomSuffix.toString()}`,
    email:
      user.email ??
      `test_user_${timestamp.toString()}_${randomSuffix.toString()}@non-existent-mail.comms`,
    password: user.password ?? "123123",
    role: user.role ?? "USER",
    githubId: user.githubId ?? null,
    googleId: user.googleId ?? null,
    "confirm-password": user["confirm-password"] ?? "123123",
  };

  return newUser;
}

export { createNewUserInput };

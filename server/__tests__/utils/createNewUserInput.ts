interface CreateNewUserInputOptions {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: "USER" | "ADMIN";
}

function createNewUserInput(user: CreateNewUserInputOptions = {}) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);

  const newUser = {
    id: user.id ?? `${timestamp.toString()}_${randomSuffix.toString()}`,
    name: user.name ?? `test_user_${randomSuffix.toString()}`,
    email:
      user.email ??
      `test_user_${timestamp.toString()}_${randomSuffix.toString()}@non-existent-mail.comms`,
    password: user.password ?? "Password123",
    role: user.role ?? "USER",
  };

  return newUser;
}

export { createNewUserInput };

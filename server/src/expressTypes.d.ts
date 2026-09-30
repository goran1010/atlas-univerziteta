import type { auth } from "./config/auth.js";

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthSession | undefined;
    }
  }
}

export {};

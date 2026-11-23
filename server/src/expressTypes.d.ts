import type { auth } from "./config/auth.js";

declare global {
  namespace Express {
    interface Request {
      authSession?: typeof auth.$Infer.Session;
    }
  }
}

export {};

import expressSession from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "../db/prisma.js";
import { env } from "./env.js";

const NUMBER_OF_DAYS = 30;
const IS_PRODUCTION = env.NODE_ENV === "production";

const sessionMiddleware = expressSession({
  name: "sessionId",
  proxy: IS_PRODUCTION,
  // Cookie options must stay in sync with res.clearCookie() in the logout
  // controller (usersController.ts) - a mismatch can leave the cookie behind.
  cookie: {
    maxAge: NUMBER_OF_DAYS * 24 * 60 * 60 * 1000,
    sameSite: "strict",
    secure: IS_PRODUCTION,
    httpOnly: true,
    path: "/",
  },
  secret: env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
  }),
});

export { sessionMiddleware };

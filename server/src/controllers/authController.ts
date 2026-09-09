import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { passport } from "../config/passport.js";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { sendConfirmationEmail } from "../email/confirmationEmail.js";
import { emailConfirmHTML } from "../utils/emailConfirmHTML.js";
import { sendError, sendSuccess } from "../utils/response.js";
import * as authValidation from "../validation/authValidation.js";

import type { NextFunction, Request, Response } from "express";

type PassportMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

function isPassportMiddleware(value: unknown): value is PassportMiddleware {
  return typeof value === "function";
}

function getPassportMiddleware(value: unknown): PassportMiddleware {
  if (!isPassportMiddleware(value)) {
    throw new TypeError("Passport authenticate() did not return middleware.");
  }

  return value;
}

function getAuthenticationMessage(info: unknown): string {
  if (typeof info === "string") {
    return info;
  }

  if (
    typeof info === "object" &&
    info !== null &&
    "message" in info &&
    typeof info.message === "string"
  ) {
    return info.message;
  }

  return "Invalid email or password";
}

async function signup(req: Request, res: Response) {
  const { email, password } = authValidation.signup(req.body);

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    sendError(res, {
      status: 400,
      message: "Signup failed: check your input and try again.",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const confirmationToken = crypto.randomBytes(32).toString("hex");

  const confirmationLink = `${env.SERVER_URL}/auth/confirm/${confirmationToken}`;

  const existingPending = await prisma.pendingUser.findMany({
    where: {
      email,
    },
  });

  if (existingPending.length > 0) {
    await prisma.pendingUser.updateMany({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
        token: confirmationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } else {
    await prisma.pendingUser.create({
      data: {
        email,
        password: hashedPassword,
        token: confirmationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  const result = await sendConfirmationEmail(email, confirmationLink);

  if (result.success) {
    sendSuccess(res, {
      status: 201,
      data: {
        email,
      },
      message: "Registration successful! Check your email.",
    });
    return;
  }

  await prisma.pendingUser.deleteMany({
    where: {
      email,
    },
  });

  sendError(res, {
    status: 500,
    message:
      "Signup failed: confirmation email was not sent. Check your email address and try again.",
  });
}

async function confirmEmail(req: Request, res: Response) {
  const { token } = authValidation.confirmToken(req.params);

  const pendingUsers = await prisma.pendingUser.findMany({
    where: {
      token,
    },
  });

  const pendingUser = pendingUsers[0];

  if (!pendingUser) {
    sendError(res, {
      status: 400,
      message:
        "Email confirmation failed: token is invalid or expired. Request a new confirmation email.",
    });
    return;
  }

  if (pendingUser.expiresAt < new Date()) {
    await prisma.pendingUser.delete({
      where: {
        id: pendingUser.id,
      },
    });

    sendError(res, {
      status: 400,
      message: "Token expired. Please sign up again.",
    });
    return;
  }

  await prisma.user.create({
    data: {
      email: pendingUser.email,
      password: pendingUser.password,
    },
  });

  await prisma.pendingUser.delete({
    where: {
      id: pendingUser.id,
    },
  });

  res.send(emailConfirmHTML());
}

function login(req: Request, res: Response, next: NextFunction) {
  authValidation.login(req.body);

  getPassportMiddleware(
    passport.authenticate(
      "local",
      (
        error: unknown,
        user: Express.User | false | null | undefined,
        info: unknown,
      ) => {
        if (error) {
          next(error);
          return;
        }

        if (!user) {
          const loginReason = getAuthenticationMessage(info);

          sendError(res, {
            status: 401,
            message: `Login failed: ${loginReason}. Check your credentials and try again.`,
          });
          return;
        }

        req.session.regenerate((regenerateError) => {
          if (regenerateError) {
            next(regenerateError);
            return;
          }

          req.logIn(user, (loginError) => {
            if (loginError) {
              next(loginError);
              return;
            }

            sendSuccess(res, {
              message: "Logged in successfully",
              data: user,
            });
          });
        });
      },
    ),
  )(req, res, next);
}

function githubLogin(req: Request, res: Response, next: NextFunction) {
  getPassportMiddleware(
    passport.authenticate("github", {
      scope: ["user:email"],
    }),
  )(req, res, next);
}

function githubCallback(req: Request, res: Response, next: NextFunction) {
  getPassportMiddleware(
    passport.authenticate(
      "github",
      (error: unknown, user: Express.User | false | null | undefined) => {
        if (error) {
          next(error);
          return;
        }

        if (!user) {
          res.redirect(`${env.WEBAPP_URL}/login?error=github`);
          return;
        }

        req.session.regenerate((regenerateError) => {
          if (regenerateError) {
            next(regenerateError);
            return;
          }

          req.logIn(user, (loginError) => {
            if (loginError) {
              next(loginError);
              return;
            }

            req.session.save((saveError) => {
              if (saveError) {
                next(saveError);
                return;
              }

              res.redirect(env.WEBAPP_URL);
            });
          });
        });
      },
    ),
  )(req, res, next);
}

export { signup, confirmEmail, login, githubLogin, githubCallback };

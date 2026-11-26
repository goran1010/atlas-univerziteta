import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "../db/prisma.js";
import { env } from "./env.js";
import { sendConfirmationEmail } from "../email/confirmationEmail.js";
import { sendResetPasswordEmail } from "../email/resetPasswordEmail.js";
import { logger } from "../utils/logger.js";

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: env.SERVER_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEBAPP_URL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // a blocked unverified sign-in re-sends the link, otherwise the user
    // has no way to request a new one
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendConfirmationEmail(user.email, url);
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["ADMIN", "USER"],
        defaultValue: "USER",
        input: false,
      },
      adminRequestedAt: {
        type: "string",
        required: false,
        input: false,
      },
      adminRequestReason: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  socialProviders: {
    // refresh name/image from the provider on every sign-in, so accounts
    // created before OAuth linking (or by email signup) get a photo too
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      overrideUserInfoOnSignIn: true,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      overrideUserInfoOnSignIn: true,
    },
  },
  // better-auth's own warnings and errors, as pino JSON like the rest of the
  // server's logs; pino only expands an Error when it sits under err. The
  // source lets src/sentry.ts tell these lines apart.
  logger: {
    log: (level, message, ...args: unknown[]) => {
      const err = args.find((arg) => arg instanceof Error);
      const details = args.filter((arg) => arg !== err);
      logger[level](
        {
          source: "better-auth",
          err,
          details: details.length > 0 ? details : undefined,
        },
        message,
      );
    },
  },
});

export { auth };

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "../db/prisma.js";
import { env } from "./env.js";
import { sendConfirmationEmail } from "../email/confirmationEmail.js";

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: env.SERVER_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEBAPP_URL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendConfirmationEmail(user.email, url);
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
    },
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});

export { auth };

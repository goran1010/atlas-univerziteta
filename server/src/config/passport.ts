import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import {
  Strategy as GoogleStrategy,
  type Profile as GoogleProfile,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

import { prisma } from "../db/prisma.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { env } from "./env.js";

interface GitHubProfile {
  id: string;
  emails?: { value: string; primary?: boolean; verified?: boolean }[];
}

type OAuthDoneCallback = (
  error: unknown,
  user?: Express.User | false,
  info?: { message: string },
) => void;

function runAsync(operation: () => Promise<void>): void {
  void operation();
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    (email, password, done) => {
      runAsync(async () => {
        try {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (!user?.password) {
            done(null, false, {
              message: "Incorrect email or password",
            });
            return;
          }

          const passwordMatches = await bcrypt.compare(password, user.password);

          if (!passwordMatches) {
            done(null, false, {
              message: "Incorrect email or password",
            });
            return;
          }

          done(null, sanitizeUser(user));
        } catch (error: unknown) {
          done(error);
        }
      });
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
      allRawEmails: true,
      // login-CSRF protection: any truthy value makes passport-oauth2 store
      // a random nonce in the session on /auth/github and verify it on the
      // callback ("true" is not assignable - @types narrows state to string)
      state: "session-nonce",
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: OAuthDoneCallback,
    ) => {
      runAsync(async () => {
        try {
          const githubUser = await prisma.user.findUnique({
            where: {
              githubId: profile.id,
            },
          });

          if (githubUser) {
            done(null, sanitizeUser(githubUser));
            return;
          }

          const emails = profile.emails ?? [];
          // Only trust addresses GitHub has verified - linking by an
          // unverified email would let it claim someone else's account.
          const verifiedEmail =
            emails.find((email) => email.primary && email.verified) ??
            emails.find((email) => email.verified);

          if (!verifiedEmail) {
            done(null, false, { message: "no_verified_email" });
            return;
          }

          const primaryEmail = verifiedEmail.value;

          const emailUser = await prisma.user.findUnique({
            where: {
              email: primaryEmail,
            },
          });

          if (emailUser) {
            const updatedUser = await prisma.user.update({
              where: {
                id: emailUser.id,
              },
              data: {
                githubId: profile.id,
              },
            });

            done(null, sanitizeUser(updatedUser));
            return;
          }

          const createdUser = await prisma.user.create({
            data: {
              email: primaryEmail,
              githubId: profile.id,
            },
          });

          done(null, sanitizeUser(createdUser));
        } catch (error: unknown) {
          done(error);
        }
      });
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ["email"],
      state: true,
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: GoogleProfile,
      done: OAuthDoneCallback,
    ) => {
      runAsync(async () => {
        try {
          const googleUser = await prisma.user.findUnique({
            where: {
              googleId: profile.id,
            },
          });

          if (googleUser) {
            done(null, sanitizeUser(googleUser));
            return;
          }

          const emails = profile.emails ?? [];
          const verifiedEmail = emails.find((email) => email.verified);

          if (!verifiedEmail) {
            done(null, false, { message: "no_verified_email" });
            return;
          }

          const primaryEmail = verifiedEmail.value;

          const emailUser = await prisma.user.findUnique({
            where: {
              email: primaryEmail,
            },
          });

          if (emailUser) {
            const updatedUser = await prisma.user.update({
              where: {
                id: emailUser.id,
              },
              data: {
                googleId: profile.id,
              },
            });

            done(null, sanitizeUser(updatedUser));
            return;
          }

          const createdUser = await prisma.user.create({
            data: {
              email: primaryEmail,
              googleId: profile.id,
            },
          });

          done(null, sanitizeUser(createdUser));
        } catch (error: unknown) {
          done(error);
        }
      });
    },
  ),
);

passport.serializeUser<string>((user, done) => {
  try {
    done(null, user.id);
  } catch (error: unknown) {
    done(error);
  }
});

passport.deserializeUser<string>((id, done) => {
  runAsync(async () => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        done(null, false);
        return;
      }

      done(null, sanitizeUser(user));
    } catch (error: unknown) {
      done(error);
    }
  });
});

export { passport };

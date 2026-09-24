import { Router } from "express";
const authRouter = Router();
import * as authController from "../controllers/authController.js";
import { isNotAuthenticated } from "../auth/isNotAuthenticated.js";

import { csrfSync } from "csrf-sync";
const { csrfSynchronisedProtection } = csrfSync();

authRouter.post(
  "/signup",
  csrfSynchronisedProtection,
  isNotAuthenticated,
  authController.signup,
);

authRouter.get(
  "/confirm/:token",
  csrfSynchronisedProtection,
  isNotAuthenticated,
  authController.confirmEmail,
);

authRouter.post(
  "/login",
  csrfSynchronisedProtection,
  isNotAuthenticated,
  authController.login,
);

authRouter.get("/github", authController.githubLogin);
authRouter.get("/github/callback", authController.githubCallback);

authRouter.get("/google", authController.googleLogin);
authRouter.get("/google/callback", authController.googleCallback);

export { authRouter };

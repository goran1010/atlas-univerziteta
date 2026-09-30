import { Router } from "express";
const usersRouter = Router();
import * as usersController from "../controllers/usersController.js";
import { adminRouter } from "./adminRouter.js";
import { isAdmin } from "../auth/isAdmin.js";
import { contributionRouter } from "./contributionRouter.js";
import { isAuthenticated } from "../auth/isAuthenticated.js";

usersRouter.use(isAuthenticated);

usersRouter.post("/logout", usersController.logout);

usersRouter.post("/request-admin", usersController.requestAdmin);

usersRouter.delete("/request-admin", usersController.cancelAdminRequest);

usersRouter.use("/admin", isAdmin, adminRouter);

usersRouter.use("/contribution", contributionRouter);

export { usersRouter };

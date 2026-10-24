import { Router } from "express";
const apiRouter = Router();

import * as apiController from "../controllers/apiController.js";
import { v1Router } from "./v1Router.js";

apiRouter.get("/", apiController.status);

apiRouter.use("/v1", v1Router);

export { apiRouter };

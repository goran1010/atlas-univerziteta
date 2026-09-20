import { Router } from "express";
const apiRouter = Router();

import { v1Router } from "./v1Router.js";

apiRouter.use("/v1", v1Router);

export { apiRouter };

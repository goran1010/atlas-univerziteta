import { Router } from "express";
const v1Router = Router();

import * as universityController from "../controllers/v1Controller.js";

v1Router.get("/", universityController.status);

v1Router.get("/universities", universityController.getUniversities);

v1Router.get("/universities/:id", universityController.getUniversityById);

v1Router.get("/faculties/:id", universityController.getFacultyById);

v1Router.get("/study-programs/:id", universityController.getStudyProgramById);

v1Router.get("/search", universityController.search);

export { v1Router };

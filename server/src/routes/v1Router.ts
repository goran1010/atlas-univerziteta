import { Router } from "express";
const v1Router = Router();

import * as universityController from "../controllers/v1Controller.js";
import * as searchController from "../controllers/searchController.js";

// Open data changes only when a contribution is approved - let clients and
// proxies cache public GETs briefly.
v1Router.use((req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=300");
  }
  next();
});

v1Router.get("/", universityController.status);

v1Router.get("/universities", universityController.getUniversities);

v1Router.get("/universities/:id", universityController.getUniversityById);

v1Router.get("/faculties", universityController.getFaculties);

v1Router.get("/faculties/:id", universityController.getFacultyById);

v1Router.get("/study-programs", universityController.getStudyPrograms);

v1Router.get("/study-programs/:id", universityController.getStudyProgramById);

v1Router.get("/tracks", universityController.getTracks);

v1Router.get("/tracks/:id", universityController.getTrackById);

v1Router.get("/search", searchController.search);

export { v1Router };

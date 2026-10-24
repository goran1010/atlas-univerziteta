import { Router } from "express";
const v1Router = Router();

import * as v1Controller from "../controllers/v1Controller.js";
import * as searchController from "../controllers/searchController.js";

// Open data changes only when a contribution is approved - let clients and
// proxies cache public GETs briefly.
v1Router.use((req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=300");
  }
  next();
});

v1Router.get("/", v1Controller.status);

v1Router.get("/universities", v1Controller.getUniversities);

v1Router.get("/universities/:id", v1Controller.getUniversityById);

v1Router.get("/faculties", v1Controller.getFaculties);

v1Router.get("/faculties/:id", v1Controller.getFacultyById);

v1Router.get("/study-programs", v1Controller.getStudyPrograms);

v1Router.get("/study-programs/:id", v1Controller.getStudyProgramById);

v1Router.get("/tracks", v1Controller.getTracks);

v1Router.get("/tracks/:id", v1Controller.getTrackById);

v1Router.get("/search", searchController.search);

export { v1Router };

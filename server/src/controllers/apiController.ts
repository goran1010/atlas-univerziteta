import { env } from "../config/env.js";
import { sendSuccess } from "../utils/response.js";
import type { Request, Response } from "express";

function root(_req: Request, res: Response) {
  sendSuccess(res, {
    message: "Atlas Univerziteta API server is running.",
    data: {
      name: "Atlas Univerziteta API",
      docs: `${env.WEBAPP_URL}/api-docs`,
      endpoints: {
        health: "/health",
        v1: "/api/v1",
      },
    },
  });
}

export { root };

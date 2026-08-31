import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { env } from "../config/env.js";

import type { Request, Response } from "express";

const IS_PRODUCTION = env.NODE_ENV === "production";
const NUMBER_OF_DAYS = 30;

function me(req: Request, res: Response) {
  if (!req.user) {
    sendSuccess(res, {
      message: "No user logged in",
      data: null,
    });
    return;
  }

  sendSuccess(res, {
    message: "User info retrieved",
    data: req.user,
  });
}

function logout(req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      console.error(err);
      sendError(res, {
        status: 500,
        message: "Logout failed: try again.",
      });
      return;
    }

    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        sendError(res, {
          status: 500,
          message: "Logout failed: try again.",
        });
        return;
      }

      res.clearCookie("sessionId", {
        // Must set clearCookie options to match cookie set options, otherwise browser will not clear cookies
        maxAge: NUMBER_OF_DAYS * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        secure: IS_PRODUCTION,
        httpOnly: true,
        path: "/",
      });
      sendSuccess(res, {
        message: "User logged out successfully",
      });
    });
  });
}

async function requestAdmin(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "You must be logged in to request admin access.",
    });
    return;
  }

  if (req.user.role === "ADMIN") {
    sendError(res, {
      status: 400,
      message: "You already have the admin role.",
    });
    return;
  }

  const { adminRequestedAt } = await prisma.user.update({
    where: { id: req.user.id },
    data: { adminRequestedAt: new Date() },
  });

  sendSuccess(res, {
    message: "Admin access requested. An admin will review it.",
    data: { adminRequestedAt },
  });
}

async function cancelAdminRequest(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "You must be logged in to cancel an admin request.",
    });
    return;
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { adminRequestedAt: null },
  });

  sendSuccess(res, {
    message: "Admin request cancelled.",
  });
}

export { logout, me, requestAdmin, cancelAdminRequest };

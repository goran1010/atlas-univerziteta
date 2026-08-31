import { z } from "zod";
import { parseRequest } from "./parseRequest.js";

const pendingChangeSchema = z.strictObject({
  id: z.uuid({ message: "Pending change ID must be a valid UUID" }),
});

function declinePendingChange(input: unknown) {
  return parseRequest(pendingChangeSchema, input);
}

function approvePendingChange(input: unknown) {
  return parseRequest(pendingChangeSchema, input);
}

const adminRequestSchema = z.strictObject({
  id: z.uuid({ message: "User ID must be a valid UUID" }),
});

function approveAdminRequest(input: unknown) {
  return parseRequest(adminRequestSchema, input);
}

function declineAdminRequest(input: unknown) {
  return parseRequest(adminRequestSchema, input);
}

export {
  declinePendingChange,
  approvePendingChange,
  approveAdminRequest,
  declineAdminRequest,
};

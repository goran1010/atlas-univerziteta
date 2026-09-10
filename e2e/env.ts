import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

export const E2E_SERVER_URL = "http://localhost:3100";
export const E2E_WEBAPP_URL = "http://localhost:5273";

const E2E_DB_NAME = "uniatlas_e2e";

export function e2eDatabaseUrl(): string {
  const fromEnv = process.env.E2E_DATABASE_URL;
  if (fromEnv) return fromEnv;

  const serverEnvPath = path.resolve(import.meta.dirname, "../server/.env");
  if (!fs.existsSync(serverEnvPath)) {
    throw new Error(
      "Set E2E_DATABASE_URL, or provide server/.env so it can be derived from DATABASE_URL",
    );
  }

  const parsed = parseEnv(fs.readFileSync(serverEnvPath, "utf8"));
  const devUrl = parsed.DATABASE_URL;
  if (!devUrl) {
    throw new Error(
      "server/.env has no DATABASE_URL to derive the e2e database from",
    );
  }

  const url = new URL(devUrl);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}

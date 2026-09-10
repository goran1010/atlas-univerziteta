import { execSync } from "node:child_process";
import path from "node:path";
import pg from "pg";
import { E2E_SERVER_URL, E2E_WEBAPP_URL, e2eDatabaseUrl } from "./env";

export default async function globalSetup() {
  const dbUrl = e2eDatabaseUrl();
  const dbName = new URL(dbUrl).pathname.slice(1);

  const adminUrl = new URL(dbUrl);
  adminUrl.pathname = "/postgres";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  const existing = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  );
  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
  }
  await client.end();

  const serverDir = path.resolve(import.meta.dirname, "../server");
  // the seed script imports the server's env validation, which requires more
  // than the database URL - provide the same values the webServer entries use
  const env = {
    ...process.env,
    DATABASE_URL: dbUrl,
    NODE_ENV: "development",
    PORT: "3100",
    SERVER_URL: E2E_SERVER_URL,
    WEBAPP_URL: E2E_WEBAPP_URL,
  };

  execSync("npx prisma migrate reset --force", {
    cwd: serverDir,
    env,
    stdio: "inherit",
  });
  execSync("npx prisma db seed", { cwd: serverDir, env, stdio: "inherit" });
}

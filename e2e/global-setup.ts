import { execSync } from "node:child_process";
import path from "node:path";
import pg from "pg";
import { e2eDatabaseUrl } from "./env";

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
  const env = { ...process.env, DATABASE_URL: dbUrl, NODE_ENV: "development" };

  execSync("npx prisma migrate reset --force", {
    cwd: serverDir,
    env,
    stdio: "inherit",
  });
  execSync("npx prisma db seed", { cwd: serverDir, env, stdio: "inherit" });
}

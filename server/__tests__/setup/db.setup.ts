import "dotenv/config";
import { afterAll } from "vitest";
import pg from "pg";

import { env } from "../../src/config/env.js";

const { Client } = pg;
const dbName = `test_${Date.now().toString()}_${Math.random().toString(36).slice(2, 8)}`;

if (!env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL not found in environment variables.");
}
if (!process.env["TEST_DB_TEMPLATE"]) {
  throw new Error("TEST_DB_TEMPLATE not found in environment variables.");
}

const _adminUrl = new URL(env.TEST_DATABASE_URL);
_adminUrl.pathname = "/postgres";
const _adminUrlStr = _adminUrl.toString();

const _createClient = new Client({ connectionString: _adminUrlStr });
await _createClient.connect();
await _createClient.query(
  `CREATE DATABASE "${dbName}" TEMPLATE "${process.env["TEST_DB_TEMPLATE"]}"`,
);
await _createClient.end();

const _testDbUrl = new URL(env.TEST_DATABASE_URL);
_testDbUrl.pathname = `/${dbName}`;
// Every vitest fork gets its own Prisma pool; the default size
// (2 * CPUs + 1 per fork) collectively exceeds postgres max_connections
// and starves workers once a request runs many queries in parallel.
_testDbUrl.searchParams.set("connection_limit", "5");
_testDbUrl.searchParams.set("pool_timeout", "30");
env.TEST_DATABASE_URL = _testDbUrl.toString();

afterAll(async () => {
  const { prisma } = await import("../../src/db/prisma.js");
  await prisma.$disconnect();

  const dropClient = new Client({ connectionString: _adminUrlStr });
  await dropClient.connect();
  await dropClient.query(`DROP DATABASE "${dbName}" WITH (FORCE)`);
  await dropClient.end();
});
